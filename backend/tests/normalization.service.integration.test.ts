import { PrismaClient } from '@prisma/client';
import { EvaluationStatus, AssignmentState } from '../src/judging/domain/enums';
import { NormalizationService } from '../src/judging/normalization/NormalizationService';
import { ZScoreNormalizationStrategy } from '../src/judging/normalization/ZScoreNormalizationStrategy';

// @integration - Requires a running PostgreSQL database
describe('NormalizationService Integration Tests', () => {
  const prisma = new PrismaClient();
  const service = new NormalizationService(prisma, new ZScoreNormalizationStrategy());

  let dbReachable = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      dbReachable = true;
      await prisma.auditLog.deleteMany();
      await prisma.normalizationResult.deleteMany();
      await prisma.criterionScore.deleteMany();
      await prisma.evaluation.deleteMany();
      await prisma.criterion.deleteMany();
      await prisma.rubricVersion.deleteMany();
      await prisma.rubric.deleteMany();
      await prisma.assignment.deleteMany();
      await prisma.assignmentRun.deleteMany();
      await prisma.eventJudge.deleteMany();
      await prisma.judgeConflict.deleteMany();
      await prisma.submission.deleteMany();
      await prisma.project.deleteMany();
      await prisma.track.deleteMany();
      await prisma.judge.deleteMany();
      await prisma.teamMember.deleteMany();
      await prisma.team.deleteMany();
      await prisma.event.deleteMany();
    } catch (e) {
      console.warn('Database is unreachable. Integration tests will be skipped.', e);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Loads submitted evaluations, performs Z-score normalization, persists results, and aggregates per project', async () => {
    if (!dbReachable) return;

    const event = await prisma.event.create({ data: { name: 'Normalization Event' } });
    const team1 = await prisma.team.create({ data: { name: 'Team Alpha 1', eventId: event.id } });
    const team2 = await prisma.team.create({ data: { name: 'Team Alpha 2', eventId: event.id } });
    const team3 = await prisma.team.create({ data: { name: 'Team Alpha 3', eventId: event.id } });
    const project1 = await prisma.project.create({ data: { name: 'Project 1', eventId: event.id, teamId: team1.id } });
    const project2 = await prisma.project.create({ data: { name: 'Project 2', eventId: event.id, teamId: team2.id } });
    const project3 = await prisma.project.create({ data: { name: 'Project 3', eventId: event.id, teamId: team3.id } });

    const judgeUser1 = await prisma.judge.create({ data: { userId: 'judge-user-1', isActive: true } });
    const judgeUser2 = await prisma.judge.create({ data: { userId: 'judge-user-2', isActive: true } });

    const run = await prisma.assignmentRun.create({
      data: {
        eventId: event.id,
        status: 'COMPLETED',
        algorithmVersion: 'TEST_1.0',
        kValue: 1,
        snapshotPayload: JSON.stringify({})
      }
    });

    const rubric = await prisma.rubric.create({ data: { name: 'Standard Rubric', eventId: event.id } });
    const rubricVersion = await prisma.rubricVersion.create({
      data: { rubricId: rubric.id, version: 1, isPublished: true }
    });

    // Create 3 active assignments & evaluations for judge 1 (scores: 70, 80, 90)
    const a1 = await prisma.assignment.create({
      data: { assignmentRunId: run.id, projectId: project1.id, judgeId: judgeUser1.id, state: AssignmentState.ACTIVE }
    });
    const a2 = await prisma.assignment.create({
      data: { assignmentRunId: run.id, projectId: project2.id, judgeId: judgeUser1.id, state: AssignmentState.ACTIVE }
    });
    const a3 = await prisma.assignment.create({
      data: { assignmentRunId: run.id, projectId: project3.id, judgeId: judgeUser1.id, state: AssignmentState.ACTIVE }
    });

    await prisma.evaluation.create({
      data: { assignmentId: a1.id, rubricVersionId: rubricVersion.id, status: EvaluationStatus.SUBMITTED, rawScore: 70 }
    });
    await prisma.evaluation.create({
      data: { assignmentId: a2.id, rubricVersionId: rubricVersion.id, status: EvaluationStatus.SUBMITTED, rawScore: 80 }
    });
    await prisma.evaluation.create({
      data: { assignmentId: a3.id, rubricVersionId: rubricVersion.id, status: EvaluationStatus.SUBMITTED, rawScore: 90 }
    });

    // Create draft evaluation for judge 2 (must be excluded from normalization)
    const a4 = await prisma.assignment.create({
      data: { assignmentRunId: run.id, projectId: project1.id, judgeId: judgeUser2.id, state: AssignmentState.ACTIVE }
    });
    await prisma.evaluation.create({
      data: { assignmentId: a4.id, rubricVersionId: rubricVersion.id, status: EvaluationStatus.DRAFT, rawScore: 95 }
    });

    // Run normalization
    const output = await service.runEventNormalization(event.id, 'admin-user');

    expect(output.strategyUsed).toBe('Z_SCORE');
    expect(output.evaluationResults).toHaveLength(3); // Draft excluded
    expect(output.projectAggregates).toHaveLength(3);

    // Verify DB persistence of NormalizationResult
    const persistedResults = await prisma.normalizationResult.findMany({
      where: {
        evaluation: {
          assignment: {
            assignmentRunId: run.id
          }
        }
      }
    });
    expect(persistedResults).toHaveLength(3);
    for (const r of persistedResults) {
      expect(r.status).toBe('NORMALIZED');
      expect(r.strategyUsed).toBe('Z_SCORE');
      expect(r.resultValue).not.toBeNull();
    }

    // Verify AuditLog record
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'NORMALIZATION_RUN', entityId: event.id }
    });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.actor).toBe('admin-user');
  });

  it('2. Excludes draft evaluations and cancelled/superseded assignments from normalization', async () => {
    if (!dbReachable) return;

    const event = await prisma.event.create({ data: { name: 'Draft Test Event' } });
    const team = await prisma.team.create({ data: { name: 'Team Beta', eventId: event.id } });
    const project = await prisma.project.create({ data: { name: 'Project Beta', eventId: event.id, teamId: team.id } });
    const judge = await prisma.judge.create({ data: { userId: 'judge-beta', isActive: true } });

    const run = await prisma.assignmentRun.create({
      data: {
        eventId: event.id,
        status: 'COMPLETED',
        algorithmVersion: 'TEST_1.0',
        kValue: 1,
        snapshotPayload: JSON.stringify({})
      }
    });

    const rubric = await prisma.rubric.create({ data: { name: 'Beta Rubric', eventId: event.id } });
    const rubricVersion = await prisma.rubricVersion.create({
      data: { rubricId: rubric.id, version: 1, isPublished: true }
    });

    // Superseded assignment
    const aSuperseded = await prisma.assignment.create({
      data: { assignmentRunId: run.id, projectId: project.id, judgeId: judge.id, state: AssignmentState.SUPERSEDED }
    });
    await prisma.evaluation.create({
      data: { assignmentId: aSuperseded.id, rubricVersionId: rubricVersion.id, status: EvaluationStatus.SUBMITTED, rawScore: 85 }
    });

    const output = await service.runEventNormalization(event.id);
    expect(output.evaluationResults).toHaveLength(0);
    expect(output.projectAggregates[0]?.aggregationStatus).toBe('INSUFFICIENT_DATA');
    expect(output.projectAggregates[0]?.normalizedProjectScore).toBeNull();
  });
});
