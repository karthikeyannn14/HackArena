import { PrismaClient } from '@prisma/client';
import { AssignmentRunStatus } from '../src/judging/domain/enums';
import { AssignmentService } from '../src/judging/assignment/AssignmentService';
import { AssignmentSnapshotBuilder } from '../src/judging/assignment/AssignmentSnapshotBuilder';

// @integration - Requires a running PostgreSQL database
describe('AssignmentService Integration Tests', () => {
  const prisma = new PrismaClient();
  const service = new AssignmentService(prisma);

  let dbReachable = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      dbReachable = true;
    } catch (e) {
      console.warn('Database is unreachable. Integration tests will be skipped.');
    }
  });

  beforeEach(async () => {
    if (!dbReachable) return;
    await prisma.normalizationResult.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.criterionScore.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.criterion.deleteMany();
    await prisma.rubricVersion.deleteMany();
    await prisma.rubric.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.judgeConflict.deleteMany();
    await prisma.eventJudge.deleteMany();
    await prisma.assignmentRun.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.project.deleteMany();
    await prisma.track.deleteMany();
    await prisma.judge.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.event.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Judge belonging to Event A cannot be assigned to Event B (Cross-event leakage prevented)', async () => {
    if (!dbReachable) return;
    
    const eventA = await prisma.event.create({ data: { name: 'Event A' } });
    const eventB = await prisma.event.create({ data: { name: 'Event B' } });
    const teamA = await prisma.team.create({ data: { name: 'Team A', eventId: eventA.id } });
    
    const pA = await prisma.project.create({ data: { name: 'Project A', eventId: eventA.id, teamId: teamA.id } });
    
    // J1 is exclusively in Event B
    const j1 = await prisma.judge.create({ data: { userId: 'u1', isActive: true, teamId: null } });
    await prisma.eventJudge.create({ data: { eventId: eventB.id, judgeId: j1.id, status: 'ACTIVE' } });
    
    // Attempting to assign Event A should fail because J1 is not in Event A
    const runId = await service.generateAssignments(eventA.id, 'admin', 1, false);
    const run = await prisma.assignmentRun.findUnique({ where: { id: runId } });
    
    expect(run?.status).toBe(AssignmentRunStatus.FAILED);
  });

  it('2. EventJudge status rules: INVITED, SUSPENDED excluded. ACTIVE is eligible.', async () => {
    if (!dbReachable) return;
    
    const event = await prisma.event.create({ data: { name: 'Status Event' } });
    const team = await prisma.team.create({ data: { name: 'Team B', eventId: event.id } });
    await prisma.project.create({ data: { name: 'Project B', eventId: event.id, teamId: team.id } });
    
    // J_Invited
    const jInvited = await prisma.judge.create({ data: { userId: 'u2', isActive: true, teamId: null } });
    await prisma.eventJudge.create({ data: { eventId: event.id, judgeId: jInvited.id, status: 'INVITED' } });
    
    // J_Suspended
    const jSuspended = await prisma.judge.create({ data: { userId: 'u3', isActive: true, teamId: null } });
    await prisma.eventJudge.create({ data: { eventId: event.id, judgeId: jSuspended.id, status: 'SUSPENDED' } });
    
    // J_Active
    const jActive = await prisma.judge.create({ data: { userId: 'u4', isActive: true, teamId: null } });
    await prisma.eventJudge.create({ data: { eventId: event.id, judgeId: jActive.id, status: 'ACTIVE' } });

    // K=1, needs 1 judge. Only jActive should be assigned.
    const runId = await service.generateAssignments(event.id, 'admin', 1, false);
    const run = await prisma.assignmentRun.findUnique({ where: { id: runId }, include: { assignments: true } });
    
    expect(run?.status).toBe(AssignmentRunStatus.COMPLETED);
    expect(run?.assignments.length).toBe(1);
    expect(run?.assignments[0]?.judgeId).toBe(jActive.id);
  });

  it('3. Same judge can participate in multiple events', async () => {
    if (!dbReachable) return;
    
    const event1 = await prisma.event.create({ data: { name: 'Multi Event 1' } });
    const event2 = await prisma.event.create({ data: { name: 'Multi Event 2' } });
    const team1 = await prisma.team.create({ data: { name: 'Team C1', eventId: event1.id } });
    const team2 = await prisma.team.create({ data: { name: 'Team C2', eventId: event2.id } });
    
    await prisma.project.create({ data: { name: 'P_E1', eventId: event1.id, teamId: team1.id } });
    await prisma.project.create({ data: { name: 'P_E2', eventId: event2.id, teamId: team2.id } });
    
    // J5 participates in both
    const j5 = await prisma.judge.create({ data: { userId: 'u5', isActive: true, teamId: null } });
    await prisma.eventJudge.create({ data: { eventId: event1.id, judgeId: j5.id, status: 'ACTIVE' } });
    await prisma.eventJudge.create({ data: { eventId: event2.id, judgeId: j5.id, status: 'ACTIVE' } });
    
    const runId1 = await service.generateAssignments(event1.id, 'admin', 1, false);
    const runId2 = await service.generateAssignments(event2.id, 'admin', 1, false);
    
    const run1 = await prisma.assignmentRun.findUnique({ where: { id: runId1 }, include: { assignments: true } });
    const run2 = await prisma.assignmentRun.findUnique({ where: { id: runId2 }, include: { assignments: true } });
    
    expect(run1?.status).toBe(AssignmentRunStatus.COMPLETED);
    expect(run1?.assignments[0]?.judgeId).toBe(j5.id);
    
    expect(run2?.status).toBe(AssignmentRunStatus.COMPLETED);
    expect(run2?.assignments[0]?.judgeId).toBe(j5.id);
  });

  it('4. Historical snapshot remains unchanged after EventJudge status changes', async () => {
    if (!dbReachable) return;
    
    const event = await prisma.event.create({ data: { name: 'History Event' } });
    const team = await prisma.team.create({ data: { name: 'Team D', eventId: event.id } });
    await prisma.project.create({ data: { name: 'Project D', eventId: event.id, teamId: team.id } });
    
    const j6 = await prisma.judge.create({ data: { userId: 'u6', isActive: true, teamId: null } });
    const ej = await prisma.eventJudge.create({ data: { eventId: event.id, judgeId: j6.id, status: 'ACTIVE' } });

    const runId = await service.generateAssignments(event.id, 'admin', 1, false);
    
    // Now suspend the judge
    await prisma.eventJudge.update({
      where: { id: ej.id },
      data: { status: 'SUSPENDED' }
    });
    
    // Verify historical snapshot still lists them as eligible
    const run = await prisma.assignmentRun.findUnique({ where: { id: runId } });
    const snapshotPayload = typeof run?.snapshotPayload === 'string' ? JSON.parse(run.snapshotPayload) : run?.snapshotPayload;
    expect(snapshotPayload.eligibleJudges.some((j: any) => j.judgeId === j6.id)).toBe(true);
  });

  it('5. Existing conflict rules still work', async () => {
    if (!dbReachable) return;
    
    const event = await prisma.event.create({ data: { name: 'Conflict Event' } });
    const team = await prisma.team.create({ data: { name: 'Team E', eventId: event.id } });
    const p1 = await prisma.project.create({ data: { name: 'Project E', eventId: event.id, teamId: team.id } });
    
    const j7 = await prisma.judge.create({ data: { userId: 'u7', isActive: true, teamId: null } });
    const j8 = await prisma.judge.create({ data: { userId: 'u8', isActive: true, teamId: null } });
    
    await prisma.eventJudge.create({ data: { eventId: event.id, judgeId: j7.id, status: 'ACTIVE' } });
    await prisma.eventJudge.create({ data: { eventId: event.id, judgeId: j8.id, status: 'ACTIVE' } });
    
    await prisma.judgeConflict.create({
      data: { judgeId: j7.id, projectId: p1.id, reason: 'DECLARED' }
    });

    const runId = await service.generateAssignments(event.id, 'admin', 1, false);
    const run = await prisma.assignmentRun.findUnique({ where: { id: runId }, include: { assignments: true } });
    
    expect(run?.assignments.length).toBe(1);
    expect(run?.assignments[0]?.judgeId).toBe(j8.id); // J7 is excluded by conflict rule
  });
});
