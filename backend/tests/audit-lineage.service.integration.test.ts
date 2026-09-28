import { PrismaClient } from '@prisma/client';
import { AssignmentState, EvaluationStatus } from '../src/judging/domain/enums';
import { AuditService, AuditAction } from '../src/judging/audit';
import { EvaluationService } from '../src/judging/evaluation/EvaluationService';
import { AssignmentService } from '../src/judging/assignment/AssignmentService';
import { JudgeService } from '../src/judging/management/JudgeService';
import { RubricService } from '../src/judging/rubric/RubricService';

// @integration - Requires a running PostgreSQL database
describe('Phase 6A: Audit & Lineage Integration Tests', () => {
  const prisma = new PrismaClient();
  const auditService = new AuditService(prisma);
  const evaluationService = new EvaluationService(prisma);
  const assignmentService = new AssignmentService(prisma);
  const judgeService = new JudgeService(prisma);
  const rubricService = new RubricService(prisma);

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

  // 1. AuditService: Query trail, event logs, actor history
  it('1. AuditService queries audit trail, event logs, and actor history with deterministic ordering', async () => {
    if (!dbReachable) return;

    const event = await prisma.event.create({ data: { name: 'Audit Test Event' } });
    const judge = await prisma.judge.create({ data: { userId: 'audit-judge-user' } });

    // Invite and accept judge
    const ejId = await judgeService.inviteJudge(event.id, judge.id, 'admin-actor');
    await judgeService.acceptInvitation(event.id, judge.id, 'audit-judge-user');

    // Query audit trail by entity
    const trail = await auditService.getAuditTrail('EventJudge', ejId);
    expect(trail).toHaveLength(2);
    expect(trail[0]?.action).toBe(AuditAction.JUDGE_INVITED);
    expect(trail[1]?.action).toBe(AuditAction.JUDGE_ACCEPTED);
    expect((trail[0]?.timestamp.getTime() ?? 0)).toBeLessThanOrEqual((trail[1]?.timestamp.getTime() ?? 0));

    // Query event audit logs
    const eventLogs = await auditService.getEventAuditLogs(event.id);
    expect(eventLogs.length).toBeGreaterThanOrEqual(2);

    // Query actor history
    const actorHistory = await auditService.getActorHistory('audit-judge-user');
    expect(actorHistory).toHaveLength(1);
    expect(actorHistory[0]?.action).toBe(AuditAction.JUDGE_ACCEPTED);

    // Action filtering
    const acceptedOnly = await auditService.getAuditTrail('EventJudge', ejId, {
      action: AuditAction.JUDGE_ACCEPTED
    });
    expect(acceptedOnly).toHaveLength(1);
    expect(acceptedOnly[0]?.action).toBe(AuditAction.JUDGE_ACCEPTED);
  });

  // 2. Evaluation reopening workflow
  it('2. Evaluation reopening: organizer can reopen, judge cannot, audit event emitted and previous submission preserved', async () => {
    if (!dbReachable) return;

    const event = await prisma.event.create({ data: { name: 'Reopen Event' } });
    const team = await prisma.team.create({ data: { name: 'Reopen Team', eventId: event.id } });
    const project = await prisma.project.create({ data: { name: 'Reopen Project', eventId: event.id, teamId: team.id } });
    const judge = await prisma.judge.create({ data: { userId: 'judge-eval-owner', isActive: true } });

    const run = await prisma.assignmentRun.create({
      data: { eventId: event.id, status: 'COMPLETED', algorithmVersion: 'TEST_1.0', kValue: 1, snapshotPayload: JSON.stringify({}) }
    });

    const assignment = await prisma.assignment.create({
      data: { assignmentRunId: run.id, projectId: project.id, judgeId: judge.id, state: AssignmentState.ACTIVE }
    });

    const rubric = await prisma.rubric.create({ data: { name: 'Reopen Rubric', eventId: event.id } });
    const version = await prisma.rubricVersion.create({
      data: { rubricId: rubric.id, version: 1, isPublished: true }
    });
    const criterion = await prisma.criterion.create({
      data: { rubricVersionId: version.id, name: 'Quality', weight: 100, maxScore: 10, displayOrder: 1, isRequired: true }
    });

    const evalId = await evaluationService.startEvaluation(assignment.id, version.id, 'judge-eval-owner');
    await evaluationService.submitEvaluation(evalId, [{ criterionId: criterion.id, score: 8 }], 'judge-eval-owner');

    const submittedEval = await prisma.evaluation.findUnique({ where: { id: evalId } });
    expect(submittedEval!.status).toBe(EvaluationStatus.SUBMITTED);
    expect(submittedEval!.rawScore).toBe(80);
    const originalSubmittedAt = submittedEval!.submittedAt;

    // Rule: Blank reason rejected
    await expect(
      evaluationService.reopenEvaluation(evalId, 'organizer-user', '   ')
    ).rejects.toThrow('A non-empty reason is required');

    // Rule: Judge cannot reopen their own evaluation
    await expect(
      evaluationService.reopenEvaluation(evalId, 'judge-eval-owner', 'Judge wants to edit score')
    ).rejects.toThrow('Judges cannot reopen their own submitted evaluations');

    // Organizer successfully reopens
    await evaluationService.reopenEvaluation(evalId, 'organizer-user', 'Score discrepancy check');

    const reopenedEval = await prisma.evaluation.findUnique({ where: { id: evalId } });
    expect(reopenedEval!.status).toBe(EvaluationStatus.DRAFT);
    expect(reopenedEval!.reopenCount).toBe(1);
    expect(reopenedEval!.reopenReason).toBe('Score discrepancy check');
    expect(reopenedEval!.previousSubmittedAt).toEqual(originalSubmittedAt);

    // Verify EVALUATION_REOPENED audit event
    const reopenAudit = await prisma.auditLog.findFirst({
      where: { action: AuditAction.EVALUATION_REOPENED, entityId: evalId }
    });
    expect(reopenAudit).toBeDefined();
    expect(reopenAudit!.actor).toBe('organizer-user');
    const reopenMeta = typeof reopenAudit?.metadata === 'string' ? JSON.parse(reopenAudit.metadata) : reopenAudit?.metadata;
    expect(reopenMeta?.reason).toBe('Score discrepancy check');
    expect(reopenMeta?.previousRawScore).toBe(80);
  });

  // 3. Assignment Lineage: replaceAssignment
  it('3. Assignment lineage: replacement creates new assignment, drops original, links lineage, and emits audit events', async () => {
    if (!dbReachable) return;

    const event = await prisma.event.create({ data: { name: 'Lineage Event' } });
    const team = await prisma.team.create({ data: { name: 'Lineage Team', eventId: event.id } });
    const project = await prisma.project.create({ data: { name: 'Lineage Project', eventId: event.id, teamId: team.id } });

    const judge1 = await prisma.judge.create({ data: { userId: 'judge-1-lineage', isActive: true } });
    const judge2 = await prisma.judge.create({ data: { userId: 'judge-2-lineage', isActive: true } });

    await prisma.eventJudge.create({
      data: { eventId: event.id, judgeId: judge1.id, status: 'ACTIVE' }
    });
    await prisma.eventJudge.create({
      data: { eventId: event.id, judgeId: judge2.id, status: 'ACTIVE' }
    });

    const run = await prisma.assignmentRun.create({
      data: { eventId: event.id, status: 'COMPLETED', algorithmVersion: 'TEST_1.0', kValue: 1, snapshotPayload: JSON.stringify({}) }
    });

    const origAssignment = await prisma.assignment.create({
      data: { assignmentRunId: run.id, projectId: project.id, judgeId: judge1.id, state: AssignmentState.ACTIVE }
    });

    // Replace assignment
    const replacementId = await assignmentService.replaceAssignment(
      origAssignment.id,
      judge2.id,
      'Judge 1 notified unexpected medical emergency',
      'organizer-admin'
    );

    expect(replacementId).toBeDefined();
    expect(replacementId).not.toBe(origAssignment.id);

    // Verify original assignment state
    const originalDropped = await prisma.assignment.findUnique({
      where: { id: origAssignment.id },
      include: { replacement: true }
    });
    expect(originalDropped!.state).toBe(AssignmentState.DROPPED);
    expect(originalDropped!.droppedAt).not.toBeNull();
    expect(originalDropped!.replacementReason).toBe('Judge 1 notified unexpected medical emergency');
    expect(originalDropped!.replacement?.id).toBe(replacementId);

    // Verify replacement assignment state
    const newAssignment = await prisma.assignment.findUnique({
      where: { id: replacementId },
      include: { replacedAssignment: true }
    });
    expect(newAssignment!.state).toBe(AssignmentState.ACTIVE);
    expect(newAssignment!.judgeId).toBe(judge2.id);
    expect(newAssignment!.replacedAssignmentId).toBe(origAssignment.id);
    expect(newAssignment!.replacedAssignment?.id).toBe(origAssignment.id);

    // Verify audit logs
    const replaceAudit = await prisma.auditLog.findFirst({
      where: { action: AuditAction.ASSIGNMENT_REPLACED, entityId: replacementId }
    });
    expect(replaceAudit).toBeDefined();
    expect(replaceAudit!.actor).toBe('organizer-admin');
    const replaceMeta = typeof replaceAudit?.metadata === 'string' ? JSON.parse(replaceAudit.metadata) : replaceAudit?.metadata;
    expect(replaceMeta?.previousAssignmentId).toBe(origAssignment.id);
    expect(replaceMeta?.reason).toBe('Judge 1 notified unexpected medical emergency');

    const createAudit = await prisma.auditLog.findFirst({
      where: { action: AuditAction.ASSIGNMENT_CREATED, entityId: replacementId }
    });
    expect(createAudit).toBeDefined();
    const createMeta = typeof createAudit?.metadata === 'string' ? JSON.parse(createAudit.metadata) : createAudit?.metadata;
    expect(createMeta?.isReplacement).toBe(true);
  });
});
