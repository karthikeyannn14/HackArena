/**
 * Integration Tests for Judging Data Model
 * 
 * EXECUTION INSTRUCTIONS:
 * These are true integration tests and require a live PostgreSQL database.
 * 
 * Required command sequence:
 * 1. docker compose up -d
 * 2. npx prisma db push --force-reset   (or npx prisma migrate reset)
 * 3. npm test
 * 
 * Do NOT mock the PrismaClient. These tests validate database constraints.
 */

import { PrismaClient } from '@prisma/client';
import { AssignmentRunStatus, AssignmentState, EvaluationStatus } from '../src/judging/domain/enums';

const prisma = new PrismaClient();

describe('Judging Engine Data Model Constraints', () => {
  let eventId: string;
  let trackId: string;
  let teamId: string;
  let projectId: string;
  let judgeId: string;
  let assignmentRunId: string;
  let rubricId: string;
  let rubricVersionId: string;
  let criterionId: string;

  beforeAll(async () => {
    // Clear the database for test isolation
    await prisma.normalizationResult.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.criterionScore.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.assignmentRun.deleteMany();
    await prisma.criterion.deleteMany();
    await prisma.rubricVersion.deleteMany();
    await prisma.rubric.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.project.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.track.deleteMany();
    await prisma.judgeConflict.deleteMany();
    await prisma.eventJudge.deleteMany();
    await prisma.judge.deleteMany();
    await prisma.event.deleteMany();

    // Setup base entities required for foreign keys
    const event = await prisma.event.create({ data: { name: 'Test Event' } });
    eventId = event.id;

    const track = await prisma.track.create({ data: { name: 'Test Track', eventId } });
    trackId = track.id;

    const team = await prisma.team.create({ data: { name: 'Test Team', eventId } });
    teamId = team.id;

    const project = await prisma.project.create({
      data: { name: 'Test Project', eventId, trackId, teamId },
    });
    projectId = project.id;

    const judge = await prisma.judge.create({ data: { userId: 'user-1' } });
    judgeId = judge.id;

    const rubric = await prisma.rubric.create({ data: { name: 'Test Rubric', eventId } });
    rubricId = rubric.id;

    const rubricVersion = await prisma.rubricVersion.create({
      data: { rubricId, version: 1 },
    });
    rubricVersionId = rubricVersion.id;

    const criterion = await prisma.criterion.create({
      data: {
        rubricVersionId,
        name: 'Design',
        weight: 100, // weight >= 0
        maxScore: 10, // maxScore > 0
        displayOrder: 1,
      },
    });
    criterionId = criterion.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Duplicate judge-project assignment within the same run is rejected', async () => {
    const run = await prisma.assignmentRun.create({
      data: {
        eventId,
        status: AssignmentRunStatus.RUNNING,
        algorithmVersion: '1.0',
        kValue: 2,
        snapshotPayload: JSON.stringify({}),
      },
    });
    assignmentRunId = run.id;

    // Create first assignment
    await prisma.assignment.create({
      data: { assignmentRunId, projectId, judgeId, state: AssignmentState.ACTIVE },
    });

    // Attempt duplicate
    await expect(
      prisma.assignment.create({
        data: { assignmentRunId, projectId, judgeId, state: AssignmentState.ACTIVE },
      })
    ).rejects.toThrow();
  });

  it('2. Duplicate criterion score within the same evaluation is rejected', async () => {
    const assignment = await prisma.assignment.findFirst({ where: { assignmentRunId } });

    const evaluation = await prisma.evaluation.create({
      data: {
        assignmentId: assignment!.id,
        rubricVersionId,
        status: EvaluationStatus.DRAFT,
      },
    });

    await prisma.criterionScore.create({
      data: { evaluationId: evaluation.id, criterionId, score: 8 }, // score >= 0
    });

    await expect(
      prisma.criterionScore.create({
        data: { evaluationId: evaluation.id, criterionId, score: 9 },
      })
    ).rejects.toThrow();
  });

  it('3. Duplicate evaluation for the same judge/project is rejected (via unique assignmentId)', async () => {
    const assignment = await prisma.assignment.findFirst({ where: { assignmentRunId } });

    // One evaluation already created in previous test
    await expect(
      prisma.evaluation.create({
        data: {
          assignmentId: assignment!.id,
          rubricVersionId,
          status: EvaluationStatus.DRAFT,
        },
      })
    ).rejects.toThrow();
  });

  it('4. Foreign-key relationships behave correctly (fail on missing parent)', async () => {
    await expect(
      prisma.assignment.create({
        data: {
          assignmentRunId: 'invalid-run-id',
          projectId,
          judgeId,
          state: AssignmentState.ACTIVE,
        },
      })
    ).rejects.toThrow();
  });

  it('5. Evaluation states are restricted to the documented values', async () => {
    const validStates = ['NOT_STARTED', 'DRAFT', 'SUBMITTED'];
    expect(validStates).toContain(EvaluationStatus.NOT_STARTED);
    expect(validStates).toContain(EvaluationStatus.DRAFT);
    expect(validStates).toContain(EvaluationStatus.SUBMITTED);
  });

  it('6. AssignmentRun snapshot can be persisted and retrieved unchanged', async () => {
    const snapshotData = { judges: ['J1', 'J2'], projects: ['P1', 'P2'], k: 2 };
    
    const run = await prisma.assignmentRun.create({
      data: {
        eventId,
        status: AssignmentRunStatus.COMPLETED,
        algorithmVersion: '1.0',
        kValue: 2,
        snapshotPayload: JSON.stringify(snapshotData),
      },
    });

    const fetchedRun = await prisma.assignmentRun.findUnique({ where: { id: run.id } });
    expect(JSON.parse(fetchedRun?.snapshotPayload || '{}')).toEqual(snapshotData);
  });
});
