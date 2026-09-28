import { PrismaClient } from '@prisma/client';
import { JsonField } from '../utils/JsonField';
import { AuditAction } from '../audit';

export class EvaluationService {
  constructor(private readonly prisma: PrismaClient) {}

  async startEvaluation(assignmentId: string, rubricVersionId: string, actorId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id: assignmentId },
        include: { judge: true }
      });

      if (!assignment) throw new Error('Assignment not found');
      if (assignment.state !== 'ACTIVE') throw new Error('Cannot evaluate an inactive assignment');
      if (assignment.judge.userId !== actorId) throw new Error('Unauthorized: Judge does not own this assignment');
      if (!assignment.judge.isActive) throw new Error('Judge is no longer active');

      // Check for conflicts
      const conflict = await tx.judgeConflict.findUnique({
        where: {
          judgeId_projectId: {
            judgeId: assignment.judgeId,
            projectId: assignment.projectId
          }
        }
      });
      if (conflict) {
        throw new Error('Conflicted judge cannot start evaluation');
      }

      const existing = await tx.evaluation.findUnique({
        where: { assignmentId }
      });
      if (existing) {
        throw new Error('Duplicate evaluation for one assignment is rejected');
      }

      const rubricVersion = await tx.rubricVersion.findUnique({
        where: { id: rubricVersionId }
      });
      if (!rubricVersion || !rubricVersion.isPublished) {
        throw new Error('Invalid or unpublished rubric version');
      }

      const evaluation = await tx.evaluation.create({
        data: {
          assignmentId,
          rubricVersionId,
          status: 'DRAFT'
        }
      });

      await tx.auditLog.create({
        data: {
          actor: actorId,
          action: AuditAction.EVALUATION_STARTED,
          entity: 'Evaluation',
          entityId: evaluation.id,
          metadata: JsonField.serialize({ assignmentId, rubricVersionId })
        }
      });

      return evaluation.id;
    });
  }

  async saveDraft(
    evaluationId: string,
    scoresData: { criterionId: string; score: number }[],
    actorId: string
  ): Promise<void> {
    await this.processScores(evaluationId, scoresData, actorId, false);
  }

  async submitEvaluation(
    evaluationId: string,
    scoresData: { criterionId: string; score: number }[],
    actorId: string
  ): Promise<void> {
    await this.processScores(evaluationId, scoresData, actorId, true);
  }

  /**
   * Reopens a submitted evaluation by an organizer.
   *
   * Locked Policies:
   * 1. Only an authorized organizer can reopen.
   * 2. A judge cannot reopen their own submitted evaluation.
   * 3. A submitted evaluation cannot be modified through normal judge workflow.
   * 4. Reopening must be explicit and auditable with a non-empty reason.
   * 5. Emits EVALUATION_REOPENED audit event.
   * 6. Preserves the original submission timestamp and history.
   * 7. Transitions evaluation to DRAFT status for subsequent editing.
   */
  async reopenEvaluation(evaluationId: string, organizerId: string, reason: string): Promise<void> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('A non-empty reason is required for reopening an evaluation');
    }

    return this.prisma.$transaction(async (tx) => {
      const evaluation = await tx.evaluation.findUnique({
        where: { id: evaluationId },
        include: {
          assignment: {
            include: {
              judge: true,
              project: true
            }
          }
        }
      });

      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      if (evaluation.status !== 'SUBMITTED') {
        throw new Error('Only submitted evaluations can be reopened');
      }

      // Rule: Judge cannot reopen their own submitted evaluation
      if (evaluation.assignment.judge.userId === organizerId) {
        throw new Error('Unauthorized: Judges cannot reopen their own submitted evaluations');
      }

      const previousSubmittedAt = evaluation.previousSubmittedAt || evaluation.submittedAt;
      const now = new Date();

      await tx.evaluation.update({
        where: { id: evaluationId },
        data: {
          status: 'DRAFT',
          previousSubmittedAt: previousSubmittedAt,
          reopenedAt: now,
          reopenReason: reason.trim(),
          reopenCount: evaluation.reopenCount + 1
        }
      });

      await tx.auditLog.create({
        data: {
          actor: organizerId,
          action: AuditAction.EVALUATION_REOPENED,
          entity: 'Evaluation',
          entityId: evaluationId,
          metadata: JsonField.serialize({
            eventId: evaluation.assignment.project.eventId,
            projectId: evaluation.assignment.projectId,
            judgeId: evaluation.assignment.judgeId,
            assignmentId: evaluation.assignmentId,
            reason: reason.trim(),
            reopenCount: evaluation.reopenCount + 1,
            previousSubmittedAt: evaluation.submittedAt,
            previousRawScore: evaluation.rawScore
          })
        }
      });
    });
  }

  private async processScores(
    evaluationId: string,
    scoresData: { criterionId: string; score: number }[],
    actorId: string,
    isSubmit: boolean
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const evaluation = await tx.evaluation.findUnique({
        where: { id: evaluationId },
        include: {
          assignment: { include: { judge: true } },
          rubricVersion: { include: { criteria: true } }
        }
      });

      if (!evaluation) throw new Error('Evaluation not found');
      if (evaluation.assignment.judge.userId !== actorId) throw new Error('Unauthorized: Judge does not own this evaluation');
      if (evaluation.status === 'SUBMITTED') throw new Error('Submitted evaluation cannot be modified through normal judge workflow');
      if (!evaluation.assignment.judge.isActive) throw new Error('Judge is no longer active');
      if (evaluation.assignment.state !== 'ACTIVE') throw new Error('Cannot evaluate an inactive assignment');

      // Check conflicts
      const conflict = await tx.judgeConflict.findUnique({
        where: {
          judgeId_projectId: {
            judgeId: evaluation.assignment.judgeId,
            projectId: evaluation.assignment.projectId
          }
        }
      });
      if (conflict) {
        throw new Error('Conflicted judge cannot modify evaluation');
      }

      // Check for duplicate score entries in the input
      const seenCriteria = new Set<string>();
      for (const s of scoresData) {
        if (seenCriteria.has(s.criterionId)) {
          throw new Error('Duplicate criterion score is rejected');
        }
        seenCriteria.add(s.criterionId);
      }

      const criteriaMap = new Map(evaluation.rubricVersion.criteria.map(c => [c.id, c]));

      let rawScoreTotal = 0;

      // Delete existing scores to replace them
      await tx.criterionScore.deleteMany({
        where: { evaluationId }
      });

      const creates = [];
      for (const item of scoresData) {
        const criterion = criteriaMap.get(item.criterionId);
        if (!criterion) throw new Error(`Criterion ${item.criterionId} not found in rubric version`);

        if (item.score < 0) throw new Error('Score below 0 is rejected');
        if (item.score > criterion.maxScore) throw new Error('Score above maxScore is rejected');

        const contribution = (item.score / criterion.maxScore) * criterion.weight;
        rawScoreTotal += contribution;

        creates.push({
          evaluationId,
          criterionId: item.criterionId,
          score: item.score
        });
      }

      if (creates.length > 0) {
        await tx.criterionScore.createMany({
          data: creates
        });
      }

      if (isSubmit) {
        // Enforce all required criteria are met
        for (const criterion of evaluation.rubricVersion.criteria) {
          if (criterion.isRequired && !seenCriteria.has(criterion.id)) {
            throw new Error(`Required criterion ${criterion.id} is missing score`);
          }
        }

        await tx.evaluation.update({
          where: { id: evaluationId },
          data: {
            status: 'SUBMITTED',
            rawScore: rawScoreTotal,
            submittedAt: new Date()
          }
        });

        await tx.auditLog.create({
          data: {
            actor: actorId,
            action: AuditAction.EVALUATION_SUBMITTED,
            entity: 'Evaluation',
            entityId: evaluationId,
            metadata: JsonField.serialize({ rawScore: rawScoreTotal })
          }
        });
      } else {
        await tx.evaluation.update({
          where: { id: evaluationId },
          data: {
            rawScore: rawScoreTotal
          }
        });

        await tx.auditLog.create({
          data: {
            actor: actorId,
            action: AuditAction.EVALUATION_DRAFT_SAVED,
            entity: 'Evaluation',
            entityId: evaluationId
          }
        });
      }
    });
  }
}

