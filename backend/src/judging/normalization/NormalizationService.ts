import { PrismaClient } from '@prisma/client';
import { JsonField } from '../utils/JsonField';
import { AuditAction } from '../audit';
import {
  NormalizationStrategy,
  NormalizationInput,
  NormalizationResult,
  JudgeNormalizationStats,
  ProjectAggregationResult,
  NormalizationRunOutput,
  RawEvaluation
} from './types';
import { ZScoreNormalizationStrategy } from './ZScoreNormalizationStrategy';
import { ProjectAggregator } from './ProjectAggregator';

/**
 * NormalizationService
 *
 * Orchestrates the score normalization pipeline:
 * Eligible Raw Evaluations → NormalizationStrategy → NormalizationResult → ProjectAggregation
 *
 * Responsibilities:
 * 1. Load eligible submitted evaluations (excluding drafts and cancelled assignments).
 * 2. Group evaluations by judge.
 * 3. Calculate judge statistics and execute swappable NormalizationStrategy.
 * 4. Aggregate normalized values per project without mixing raw scores.
 * 5. Record and persist NormalizationResult records and audit logs.
 */
export class NormalizationService {
  constructor(
    private readonly prisma?: PrismaClient,
    private readonly strategy: NormalizationStrategy = new ZScoreNormalizationStrategy()
  ) {}

  /**
   * Pure in-memory normalization execution.
   * Can be run without database connectivity.
   *
   * @param input NormalizationInput containing raw evaluations.
   * @param projectIds Optional array of project IDs to guarantee inclusion in aggregation.
   * @returns Complete NormalizationRunOutput.
   */
  public executeInMemory(
    input: NormalizationInput,
    projectIds?: ReadonlyArray<string>
  ): NormalizationRunOutput {
    // 1. Calculate judge statistics (if strategy supports it)
    const judgeStats = this.strategy.calculateJudgeStats
      ? this.strategy.calculateJudgeStats(input.evaluations)
      : new Map<string, JudgeNormalizationStats>();

    // 2. Produce per-evaluation normalization results
    const evaluationResults = this.strategy.normalize(input);

    // 3. Aggregate normalized values per project
    const projectAggregates = ProjectAggregator.aggregate(evaluationResults, projectIds);

    return {
      strategyUsed: this.strategy.name,
      evaluationResults,
      projectAggregates,
      judgeStats
    };
  }

  /**
   * Database-backed normalization execution for an event.
   * Loads eligible submitted evaluations, normalizes them, aggregates per project,
   * and persists NormalizationResult records.
   *
   * @param eventId The event ID.
   * @param actorId The user ID triggering the normalization.
   * @returns Complete NormalizationRunOutput.
   */
  public async runEventNormalization(eventId: string, actorId?: string): Promise<NormalizationRunOutput> {
    if (!this.prisma) {
      throw new Error('PrismaClient is required for database operations in NormalizationService');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    // Load all projects in the event
    const projects = await this.prisma.project.findMany({
      where: { eventId },
      select: { id: true }
    });
    const projectIds = projects.map(p => p.id);

    // Load only eligible, submitted evaluations for active assignments
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        status: 'SUBMITTED',
        rawScore: { not: null },
        assignment: {
          state: 'ACTIVE',
          project: {
            eventId
          }
        }
      },
      include: {
        assignment: {
          select: {
            id: true,
            judgeId: true,
            projectId: true,
            state: true
          }
        }
      }
    });

    const rawEvaluations: RawEvaluation[] = evaluations.map(e => ({
      evaluationId: e.id,
      judgeId: e.assignment.judgeId,
      projectId: e.assignment.projectId,
      rawScore: e.rawScore!
    }));

    // Execute normalization pipeline in memory
    const output = this.executeInMemory({ evaluations: rawEvaluations }, projectIds);

    // Persist results and audit log in a transaction
    await this.prisma.$transaction(async (tx) => {
      for (const r of output.evaluationResults) {
        await tx.normalizationResult.upsert({
          where: { evaluationId: r.evaluationId },
          create: {
            evaluationId: r.evaluationId,
            status: r.status,
            strategyUsed: r.strategyUsed,
            resultValue: r.normalizedValue,
            metadata: r.metadata != null ? JSON.stringify(r.metadata) : null
          },
          update: {
            status: r.status,
            strategyUsed: r.strategyUsed,
            resultValue: r.normalizedValue,
            metadata: r.metadata != null ? JSON.stringify(r.metadata) : null
          }
        });
      }

      await tx.auditLog.create({
        data: {
          actor: actorId || 'SYSTEM',
          action: AuditAction.NORMALIZATION_RUN,
          entity: 'Event',
          entityId: eventId,
          metadata: JsonField.serialize({
            strategy: this.strategy.name,
            totalEligibleEvaluations: rawEvaluations.length,
            normalizedCount: output.evaluationResults.filter(r => r.status === 'NORMALIZED').length,
            projectCount: output.projectAggregates.length
          })
        }
      });
    });

    return output;
  }

  /**
   * Retrieves aggregated project scores for an event from stored evaluations and normalization results.
   */
  public async getEventProjectAggregates(eventId: string): Promise<ProjectAggregationResult[]> {
    if (!this.prisma) {
      throw new Error('PrismaClient is required for database operations in NormalizationService');
    }

    const projects = await this.prisma.project.findMany({
      where: { eventId },
      select: { id: true }
    });
    const projectIds = projects.map(p => p.id);

    const normResults = await this.prisma.normalizationResult.findMany({
      where: {
        evaluation: {
          assignment: {
            project: {
              eventId
            }
          }
        }
      },
      include: {
        evaluation: {
          include: {
            assignment: {
              select: {
                judgeId: true,
                projectId: true
              }
            }
          }
        }
      }
    });

    const mappedResults: NormalizationResult[] = normResults.map(nr => ({
      evaluationId: nr.evaluationId,
      judgeId: nr.evaluation.assignment.judgeId,
      projectId: nr.evaluation.assignment.projectId,
      rawScore: nr.evaluation.rawScore ?? 0,
      normalizedValue: nr.resultValue,
      status: nr.status,
      strategyUsed: nr.strategyUsed ?? this.strategy.name,
      metadata: nr.metadata as any
    }));

    return ProjectAggregator.aggregate(mappedResults, projectIds);
  }
}
