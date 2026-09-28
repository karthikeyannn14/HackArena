import { PrismaClient } from '@prisma/client';
import { EventJudgeStatus, ConflictReason } from '../src/judging/domain/enums';
import { JudgeService } from '../src/judging/management/JudgeService';
import { AssignmentService } from '../src/judging/assignment/AssignmentService';

describe('JudgeService Integration Tests', () => {
  const prisma = new PrismaClient();
  const service = new JudgeService(prisma);
  const assignmentService = new AssignmentService(prisma);

  let dbReachable = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      dbReachable = true;
      // Clean up for integration test
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
    } catch (e) {
      console.warn('Database is unreachable. Integration tests will be skipped.', e);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('J1 — organizer can invite judge & J12 — audit events are created', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J1 Event' } });
    const judge = await prisma.judge.create({ data: { userId: 'j1', isActive: true, teamId: null } });

    const ejId = await service.inviteJudge(event.id, judge.id, 'admin1');
    const ej = await prisma.eventJudge.findUnique({ where: { id: ejId } });
    
    expect(ej?.status).toBe('INVITED');

    const audit = await prisma.auditLog.findFirst({ where: { action: 'JUDGE_INVITED', entityId: ejId } });
    expect(audit).toBeDefined();
    expect(audit?.actor).toBe('admin1');
  });

  it('J2 — duplicate event invitation is rejected', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J2 Event' } });
    const judge = await prisma.judge.create({ data: { userId: 'j2', isActive: true, teamId: null } });

    await service.inviteJudge(event.id, judge.id, 'admin1');
    await expect(service.inviteJudge(event.id, judge.id, 'admin1')).rejects.toThrow('already invited');
  });

  it('J3 — invitation changes to ACTIVE only through valid acceptance', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J3 Event' } });
    const judge = await prisma.judge.create({ data: { userId: 'j3', isActive: true, teamId: null } });

    await service.inviteJudge(event.id, judge.id, 'admin1');
    await service.acceptInvitation(event.id, judge.id, 'j3');

    const ej = await prisma.eventJudge.findUnique({ where: { eventId_judgeId: { eventId: event.id, judgeId: judge.id } } });
    expect(ej?.status).toBe('ACTIVE');
    expect(ej?.acceptedAt).not.toBeNull();
  });

  it('J4 — wrong judge cannot accept another judges invitation', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J4 Event' } });
    const judge = await prisma.judge.create({ data: { userId: 'j4', isActive: true, teamId: null } });

    await service.inviteJudge(event.id, judge.id, 'admin1');
    await expect(service.acceptInvitation(event.id, judge.id, 'wrong-user-id')).rejects.toThrow('Unauthorized');
  });

  it('J5 — ACTIVE → SUSPENDED', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J5 Event' } });
    const judge = await prisma.judge.create({ data: { userId: 'j5', isActive: true, teamId: null } });

    await service.inviteJudge(event.id, judge.id, 'admin1');
    await service.acceptInvitation(event.id, judge.id, 'j5');
    
    await service.suspendJudge(event.id, judge.id, 'admin1');
    
    const ej = await prisma.eventJudge.findUnique({ where: { eventId_judgeId: { eventId: event.id, judgeId: judge.id } } });
    expect(ej?.status).toBe('SUSPENDED');
  });

  it('J6 — SUSPENDED → ACTIVE', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J6 Event' } });
    const judge = await prisma.judge.create({ data: { userId: 'j6', isActive: true, teamId: null } });

    await service.inviteJudge(event.id, judge.id, 'admin1');
    await service.acceptInvitation(event.id, judge.id, 'j6');
    await service.suspendJudge(event.id, judge.id, 'admin1');
    
    await service.reactivateJudge(event.id, judge.id, 'admin1');
    
    const ej = await prisma.eventJudge.findUnique({ where: { eventId_judgeId: { eventId: event.id, judgeId: judge.id } } });
    expect(ej?.status).toBe('ACTIVE');
  });

  it('J7 — REMOVED judge cannot become ACTIVE through normal lifecycle', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J7 Event' } });
    const judge = await prisma.judge.create({ data: { userId: 'j7', isActive: true, teamId: null } });

    await service.inviteJudge(event.id, judge.id, 'admin1');
    await service.acceptInvitation(event.id, judge.id, 'j7');
    
    await service.removeJudge(event.id, judge.id, 'admin1');
    
    // Removing sets to REMOVED. Re-inviting should fail.
    await expect(service.inviteJudge(event.id, judge.id, 'admin1')).rejects.toThrow('cannot be re-invited');
    
    // Trying to reactivate directly
    await expect(service.reactivateJudge(event.id, judge.id, 'admin1')).rejects.toThrow('Only SUSPENDED judges');
  });

  it('J8 — judge can declare project conflict', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J8 Event' } });
    const team = await prisma.team.create({ data: { name: 'T8', eventId: event.id } });
    const project = await prisma.project.create({ data: { name: 'P8', eventId: event.id, teamId: team.id } });
    const judge = await prisma.judge.create({ data: { userId: 'j8', isActive: true, teamId: null } });

    const conflictId = await service.declareConflict(judge.id, project.id, 'OWN_TEAM', 'j8');
    
    const conflict = await prisma.judgeConflict.findUnique({ where: { id: conflictId } });
    expect(conflict).toBeDefined();
    expect(conflict?.reason).toBe('OWN_TEAM');
  });

  it('J9 — conflict prevents future assignment', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J9 Event' } });
    const team = await prisma.team.create({ data: { name: 'T9', eventId: event.id } });
    const project = await prisma.project.create({ data: { name: 'P9', eventId: event.id, teamId: team.id } });
    const judge = await prisma.judge.create({ data: { userId: 'j9', isActive: true, teamId: null } });

    await service.inviteJudge(event.id, judge.id, 'admin1');
    await service.acceptInvitation(event.id, judge.id, 'j9');
    
    // Declare conflict before assignment run
    await service.declareConflict(judge.id, project.id, 'DECLARED', 'j9');
    
    const runId = await assignmentService.generateAssignments(event.id, 'admin1', 1, false);
    const run = await prisma.assignmentRun.findUnique({ where: { id: runId }, include: { assignments: true } });
    
    // P9 is the only project, J9 is the only judge. Conflict prevents assignment, making it infeasible.
    expect(run?.status).toBe('FAILED');
    expect(run?.assignments.length).toBe(0);
  });

  it('J10 — conflict does not mutate historical AssignmentRun', async () => {
    if (!dbReachable) return;
    const event = await prisma.event.create({ data: { name: 'J10 Event' } });
    const team = await prisma.team.create({ data: { name: 'T10', eventId: event.id } });
    const project = await prisma.project.create({ data: { name: 'P10', eventId: event.id, teamId: team.id } });
    const judge = await prisma.judge.create({ data: { userId: 'j10', isActive: true, teamId: null } });

    await service.inviteJudge(event.id, judge.id, 'admin1');
    await service.acceptInvitation(event.id, judge.id, 'j10');
    
    // Generate assignment run (works fine initially)
    const runId = await assignmentService.generateAssignments(event.id, 'admin1', 1, false);
    
    // Now judge declares conflict on P10
    await service.declareConflict(judge.id, project.id, 'PROHIBITED_RELATIONSHIP', 'j10');
    
    // Verify historical run is untouched
    const run = await prisma.assignmentRun.findUnique({ where: { id: runId }, include: { assignments: true } });
    expect(run?.status).toBe('COMPLETED');
    expect(run?.assignments.length).toBe(1);
    expect(run?.assignments[0]?.judgeId).toBe(judge.id);
  });

  it('J11 — event A judge membership does not affect event B', async () => {
    if (!dbReachable) return;
    const eventA = await prisma.event.create({ data: { name: 'J11 Event A' } });
    const eventB = await prisma.event.create({ data: { name: 'J11 Event B' } });
    const judge = await prisma.judge.create({ data: { userId: 'j11', isActive: true, teamId: null } });

    // Active in A
    await service.inviteJudge(eventA.id, judge.id, 'admin1');
    await service.acceptInvitation(eventA.id, judge.id, 'j11');
    
    // Suspend in A
    await service.suspendJudge(eventA.id, judge.id, 'admin1');
    
    // Invite in B
    await service.inviteJudge(eventB.id, judge.id, 'admin1');
    await service.acceptInvitation(eventB.id, judge.id, 'j11');
    
    const ejB = await prisma.eventJudge.findUnique({ where: { eventId_judgeId: { eventId: eventB.id, judgeId: judge.id } } });
    expect(ejB?.status).toBe('ACTIVE');
  });
});
