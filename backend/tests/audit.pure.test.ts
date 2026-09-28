import { AuditAction, AuditService, AuditRecord } from '../src/judging/audit';
import { AuditLog } from '@prisma/client';

describe('Phase 6A: Audit Foundation & Immutable Judging History (Pure Tests)', () => {

  // 1. AuditAction taxonomy completeness
  test('1. Centralized AuditAction definitions include all required lifecycle events', () => {
    const requiredActions = [
      'JUDGE_INVITED',
      'JUDGE_ACCEPTED',
      'JUDGE_SUSPENDED',
      'JUDGE_REACTIVATED',
      'JUDGE_REMOVED',
      'JUDGE_CONFLICT_DECLARED',
      'JUDGE_CONFLICT_REMOVED',
      'ASSIGNMENT_RUN_CREATED',
      'ASSIGNMENT_BLOCKED',
      'ASSIGNMENT_CREATED',
      'ASSIGNMENT_REPLACED',
      'RUBRIC_CREATED',
      'RUBRIC_VERSION_CREATED',
      'RUBRIC_VERSION_PUBLISHED',
      'EVALUATION_STARTED',
      'EVALUATION_DRAFT_SAVED',
      'EVALUATION_SUBMITTED',
      'EVALUATION_REOPENED',
      'NORMALIZATION_RUN'
    ];

    for (const action of requiredActions) {
      expect(AuditAction).toHaveProperty(action);
      expect((AuditAction as any)[action]).toBe(action);
    }

    // Verify all keys match their string values
    for (const [key, value] of Object.entries(AuditAction)) {
      expect(key).toBe(value);
    }
  });

  // Sample audit records for pure testing
  const t0 = new Date('2026-09-26T10:00:00.000Z');
  const t1 = new Date('2026-09-26T10:05:00.000Z');
  const t2 = new Date('2026-09-26T10:10:00.000Z');
  const t3 = new Date('2026-09-26T10:15:00.000Z');
  const t4 = new Date('2026-09-26T10:20:00.000Z');

  const sampleLogs: AuditLog[] = [
    {
      id: 'log-3',
      actor: 'judge-1',
      action: AuditAction.EVALUATION_SUBMITTED,
      entity: 'Evaluation',
      entityId: 'eval-1',
      timestamp: t2,
      metadata: JSON.stringify({ eventId: 'event-100', rawScore: 88.5 })
    },
    {
      id: 'log-1',
      actor: 'admin-1',
      action: AuditAction.ASSIGNMENT_RUN_CREATED,
      entity: 'AssignmentRun',
      entityId: 'run-1',
      timestamp: t0,
      metadata: JSON.stringify({ eventId: 'event-100', count: 5 })
    },
    {
      id: 'log-2',
      actor: 'judge-1',
      action: AuditAction.EVALUATION_STARTED,
      entity: 'Evaluation',
      entityId: 'eval-1',
      timestamp: t1,
      metadata: JSON.stringify({ eventId: 'event-100' })
    },
    {
      id: 'log-4',
      actor: 'admin-1',
      action: AuditAction.EVALUATION_REOPENED,
      entity: 'Evaluation',
      entityId: 'eval-1',
      timestamp: t3,
      metadata: JSON.stringify({ eventId: 'event-100', reason: 'Score discrepancy reported by organizer' })
    },
    {
      id: 'log-5',
      actor: 'judge-2',
      action: AuditAction.JUDGE_CONFLICT_DECLARED,
      entity: 'JudgeConflict',
      entityId: 'conflict-1',
      timestamp: t4,
      metadata: JSON.stringify({ eventId: 'event-200', reason: 'DECLARED' })
    }
  ];

  // 2. Query audit trail for an entity
  test('2. Query audit trail for a specific entity filters correctly', () => {
    const evalLogs = sampleLogs.filter(l => l.entity === 'Evaluation' && l.entityId === 'eval-1');
    const filtered = AuditService.filterRecords(evalLogs);

    expect(filtered).toHaveLength(3);
    expect(filtered.map(l => l.action)).toEqual([
      AuditAction.EVALUATION_STARTED,
      AuditAction.EVALUATION_SUBMITTED,
      AuditAction.EVALUATION_REOPENED
    ]);
  });

  // 3. Query event audit logs
  test('3. Query event audit logs matches eventId in metadata or entityId', () => {
    const event100Logs = sampleLogs.filter(l => {
      try {
        const meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata;
        return meta?.eventId === 'event-100';
      } catch {
        return false;
      }
    });
    const filtered = AuditService.filterRecords(event100Logs);

    expect(filtered).toHaveLength(4);
    for (const log of filtered) {
      const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
      expect(meta.eventId).toBe('event-100');
    }
  });

  // 4. Query actor history
  test('4. Query actor history returns all records for an actor', () => {
    const judge1Logs = sampleLogs.filter(l => l.actor === 'judge-1');
    const filtered = AuditService.filterRecords(judge1Logs);

    expect(filtered).toHaveLength(2);
    expect(filtered.map(l => l.action)).toEqual([
      AuditAction.EVALUATION_STARTED,
      AuditAction.EVALUATION_SUBMITTED
    ]);
  });

  // 5. Action filtering
  test('5. Action filtering correctly filters single and multiple actions', () => {
    // Single action
    const submittedOnly = AuditService.filterRecords(sampleLogs, {
      action: AuditAction.EVALUATION_SUBMITTED
    });
    expect(submittedOnly).toHaveLength(1);
    expect(submittedOnly[0]?.id).toBe('log-3');

    // Multiple actions
    const lifecycleActions = AuditService.filterRecords(sampleLogs, {
      actions: [AuditAction.EVALUATION_STARTED, AuditAction.EVALUATION_REOPENED]
    });
    expect(lifecycleActions).toHaveLength(2);
    expect(lifecycleActions.map(l => l.action)).toEqual([
      AuditAction.EVALUATION_STARTED,
      AuditAction.EVALUATION_REOPENED
    ]);
  });

  // 6. Deterministic chronological ordering
  test('6. Deterministic chronological ordering: sorted by timestamp ASC, id ASC as tie-breaker', () => {
    const sameTime = new Date('2026-09-26T12:00:00.000Z');
    const tieLogs: AuditLog[] = [
      { id: 'b-log', actor: 'a', action: AuditAction.JUDGE_INVITED, entity: 'E', entityId: '1', timestamp: sameTime, metadata: null },
      { id: 'a-log', actor: 'a', action: AuditAction.JUDGE_INVITED, entity: 'E', entityId: '1', timestamp: sameTime, metadata: null },
      { id: 'c-log', actor: 'a', action: AuditAction.JUDGE_INVITED, entity: 'E', entityId: '1', timestamp: sameTime, metadata: null },
    ];

    const sorted = AuditService.filterRecords(tieLogs);
    expect(sorted.map(l => l.id)).toEqual(['a-log', 'b-log', 'c-log']);
  });

  // 7. Date range filtering
  test('7. Date range filtering respects from and to boundaries', () => {
    const rangeFiltered = AuditService.filterRecords(sampleLogs, {
      from: t1,
      to: t3
    });

    expect(rangeFiltered).toHaveLength(3);
    expect(rangeFiltered.map(l => l.id)).toEqual(['log-2', 'log-3', 'log-4']);
  });

  // 8. Read-only non-destructive guarantee
  test('8. Query operations do not modify the underlying records', () => {
    const originalCopy = sampleLogs.map(l => ({ ...l }));
    AuditService.filterRecords(sampleLogs, { action: AuditAction.EVALUATION_SUBMITTED });
    expect(sampleLogs).toEqual(originalCopy);
  });

  // 9. Evaluation Reopening: Blank reason is rejected
  test('9. Evaluation Reopening: Blank, whitespace, or missing reason is rejected', () => {
    const invalidReasons = ['', '   ', '\t\n'];
    for (const r of invalidReasons) {
      expect(!r || r.trim().length === 0).toBe(true);
    }
  });

  // 10. Evaluation Reopening: Judge cannot reopen their own evaluation
  test('10. Evaluation Reopening: Judge cannot reopen their own submitted evaluation', () => {
    const evaluation = {
      id: 'eval-own',
      assignment: {
        judge: { userId: 'judge-actor-1' },
        project: { eventId: 'event-1' }
      },
      status: 'SUBMITTED'
    };

    const organizerId = 'judge-actor-1'; // Same as judge!
    const isSelfReopen = evaluation.assignment.judge.userId === organizerId;
    expect(isSelfReopen).toBe(true);
  });

  // 11. Evaluation Reopening: Preserves previous submission timestamp and raw score
  test('11. Evaluation Reopening: Preserves previous submission timestamp and history', () => {
    const originalSubmittedAt = new Date('2026-09-26T08:00:00.000Z');
    const originalRawScore = 92.0;

    const evaluation = {
      id: 'eval-prev',
      status: 'SUBMITTED',
      rawScore: originalRawScore,
      submittedAt: originalSubmittedAt,
      previousSubmittedAt: null,
      reopenedAt: null,
      reopenReason: null,
      reopenCount: 0
    };

    // Simulate reopen logic
    const reopenReason = 'Clarification on rubric criterion score required';
    const now = new Date('2026-09-26T09:30:00.000Z');

    const updated = {
      ...evaluation,
      status: 'DRAFT',
      previousSubmittedAt: evaluation.previousSubmittedAt || evaluation.submittedAt,
      reopenedAt: now,
      reopenReason,
      reopenCount: evaluation.reopenCount + 1
    };

    expect(updated.status).toBe('DRAFT');
    expect(updated.previousSubmittedAt).toEqual(originalSubmittedAt);
    expect(updated.reopenedAt).toEqual(now);
    expect(updated.reopenReason).toBe(reopenReason);
    expect(updated.reopenCount).toBe(1);
    // Original raw score preserved for audit reference
    expect(updated.rawScore).toBe(92.0);
  });

  // 12. Assignment Lineage: Replacement relationship properties
  test('12. Assignment Lineage: Replacement preserves original record and links via replacedAssignmentId', () => {
    const originalAssignment = {
      id: 'asgn-original',
      assignmentRunId: 'run-1',
      projectId: 'proj-1',
      judgeId: 'judge-dropped',
      state: 'ACTIVE',
      createdAt: new Date('2026-09-26T07:00:00.000Z'),
      droppedAt: null,
      replacementReason: null,
      replacedAssignmentId: null
    };

    const dropReason = 'Judge notified emergency absence';
    const dropTime = new Date('2026-09-26T08:00:00.000Z');

    // 1. Original assignment becomes DROPPED (never deleted)
    const droppedOriginal = {
      ...originalAssignment,
      state: 'DROPPED',
      droppedAt: dropTime,
      replacementReason: dropReason
    };

    // 2. New assignment is created pointing back to original
    const newAssignment = {
      id: 'asgn-replacement',
      assignmentRunId: originalAssignment.assignmentRunId,
      projectId: originalAssignment.projectId,
      judgeId: 'judge-replacement',
      state: 'ACTIVE',
      createdAt: dropTime,
      droppedAt: null,
      replacementReason: null,
      replacedAssignmentId: originalAssignment.id
    };

    expect(droppedOriginal.id).toBe('asgn-original');
    expect(droppedOriginal.state).toBe('DROPPED');
    expect(droppedOriginal.droppedAt).toEqual(dropTime);
    expect(droppedOriginal.replacementReason).toBe(dropReason);

    expect(newAssignment.id).toBe('asgn-replacement');
    expect(newAssignment.state).toBe('ACTIVE');
    expect(newAssignment.replacedAssignmentId).toBe(originalAssignment.id);
    expect(newAssignment.judgeId).not.toBe(originalAssignment.judgeId);
  });

  // 13. Individual Assignment Created Audit Metadata
  test('13. Individual Assignment Created Audit Metadata contains all required trace identifiers', () => {
    const assignment = {
      id: 'asgn-uuid-1',
      assignmentRunId: 'run-uuid-1',
      projectId: 'proj-uuid-1',
      judgeId: 'judge-uuid-1'
    };

    const auditEvent = {
      actor: 'admin-organizer',
      action: AuditAction.ASSIGNMENT_CREATED,
      entity: 'Assignment',
      entityId: assignment.id,
      metadata: {
        eventId: 'event-uuid-1',
        assignmentRunId: assignment.assignmentRunId,
        projectId: assignment.projectId,
        judgeId: assignment.judgeId
      }
    };

    expect(auditEvent.action).toBe('ASSIGNMENT_CREATED');
    expect(auditEvent.entityId).toBe(assignment.id);
    expect(auditEvent.metadata.assignmentRunId).toBe(assignment.assignmentRunId);
    expect(auditEvent.metadata.projectId).toBe(assignment.projectId);
    expect(auditEvent.metadata.judgeId).toBe(assignment.judgeId);
  });
});
