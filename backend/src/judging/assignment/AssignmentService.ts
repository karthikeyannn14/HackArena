import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AssignmentSnapshotBuilder } from './AssignmentSnapshotBuilder';
import { MinCostAssignmentStrategy } from './MinCostAssignmentStrategy';
import { SnapshotIntegrity } from './SnapshotIntegrity';
import { AuditAction } from '../audit';
import { JsonField } from '../utils/JsonField';

// String literals replacing removed enums (SQLite migration)
const string = { ACTIVE: 'ACTIVE', SUPERSEDED: 'SUPERSEDED', DROPPED: 'DROPPED' } as const;

export class AssignmentService {
  constructor(private prisma: PrismaClient) {}

  public async generateAssignments(
    eventId: string,
    actorId: string,
    kValue: number,
    forceNewRun: boolean = false
  ): Promise<string> {
    
    // 1. Authorization & Idempotency / Duplicate Protection
    const activeRuns = await this.prisma.assignmentRun.findMany({
      where: {
        eventId,
        status: {
          in: ['RUNNING', 'COMPLETED', 'COMPLETED_WITH_EXCEPTIONS']
        }
      }
    });

    if (activeRuns.length > 0 && !forceNewRun) {
      throw new Error('An active assignment run already exists for this event. Use forceNewRun to supersede.');
    }

    // 2. Validate Event
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new Error(`Event ${eventId} not found.`);
    }

    // 3. Build Immutable Snapshot
    const builder = new AssignmentSnapshotBuilder(this.prisma);
    const algorithmVersion = 'MIN_COST_MAX_FLOW_1.0';
    const snapshot = await builder.build(eventId, kValue, algorithmVersion);

    // 4. Execute Strategy in-memory (Pure)
    const strategy = new MinCostAssignmentStrategy();
    const result = strategy.assign(snapshot);

    // 5. Transaction Boundary
    return await this.prisma.$transaction(async (tx) => {
      
      // If forcing a new run, mark previous runs as SUPERSEDED
      if (forceNewRun && activeRuns.length > 0) {
        await tx.assignmentRun.updateMany({
          where: { id: { in: activeRuns.map(r => r.id) } },
          data: { status: 'SUPERSEDED' }
        });
        
        // Also supersede their assignments
        await tx.assignment.updateMany({
          where: { assignmentRunId: { in: activeRuns.map(r => r.id) } },
          data: { state: 'SUPERSEDED' }
        });
      }

      const finalStatus: string = result.isGloballyFeasible 
        ? (result.unresolvedProjects.length > 0 ? 'COMPLETED_WITH_EXCEPTIONS' : 'COMPLETED')
        : 'FAILED';

      // Persist the run and snapshot — snapshotPayload is a JSON string in SQLite
      const run = await tx.assignmentRun.create({
        data: {
          id: snapshot.assignmentRunId,
          eventId,
          status: finalStatus,
          algorithmVersion: snapshot.algorithmVersion,
          kValue,
          snapshotPayload: JsonField.serialize(snapshot),
          snapshotHash: SnapshotIntegrity.calculateHash(snapshot)
        }
      });

      // If globally infeasible, log and return early without partial assignments
      if (!result.isGloballyFeasible) {
        await tx.auditLog.create({
          data: {
            actor: actorId,
            action: AuditAction.ASSIGNMENT_BLOCKED,
            entity: 'AssignmentRun',
            entityId: run.id,
            metadata: JsonField.serialize({ eventId, reason: 'Globally infeasible assignment', unresolvedCount: result.unresolvedProjects.length })
          }
        });
        return run.id;
      }

      // Persist all generated assignments atomically with explicit IDs
      const assignmentData = result.assignments.map(a => ({
        id: randomUUID(),
        assignmentRunId: run.id,
        projectId: a.projectId,
        judgeId: a.judgeId,
        state: 'ACTIVE'
      }));

      if (assignmentData.length > 0) {
        await tx.assignment.createMany({
          data: assignmentData
        });

        // Individual assignment audit records for traceability
        const individualAuditRecords = assignmentData.map(a => ({
          actor: actorId,
          action: AuditAction.ASSIGNMENT_CREATED,
          entity: 'Assignment',
          entityId: a.id,
          metadata: JsonField.serialize({
            eventId,
            assignmentRunId: run.id,
            projectId: a.projectId,
            judgeId: a.judgeId
          })
        }));

        await tx.auditLog.createMany({
          data: individualAuditRecords
        });
      }

      // Audit Log for the assignment run
      await tx.auditLog.create({
        data: {
          actor: actorId,
          action: AuditAction.ASSIGNMENT_RUN_CREATED,
          entity: 'AssignmentRun',
          entityId: run.id,
          metadata: JsonField.serialize({ eventId, status: finalStatus, assignmentCount: assignmentData.length })
        }
      });

      return run.id;
    });
  }

  /**
   * Replaces an active assignment with a new judge while maintaining full lineage.
   */
  public async replaceAssignment(
    assignmentId: string,
    newJudgeId: string,
    reason: string,
    actorId: string
  ): Promise<string> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Replacement reason is required');
    }

    return await this.prisma.$transaction(async (tx) => {
      const original = await tx.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          project: true,
          assignmentRun: true
        }
      });

      if (!original) {
        throw new Error('Assignment not found');
      }

      if (original.state !== 'ACTIVE') {
        throw new Error('Only ACTIVE assignments can be replaced');
      }

      if (original.judgeId === newJudgeId) {
        throw new Error('Replacement judge must be different from current judge');
      }

      // Verify replacement judge exists and is active
      const newJudge = await tx.judge.findUnique({
        where: { id: newJudgeId }
      });
      if (!newJudge || !newJudge.isActive) {
        throw new Error('Replacement judge is not active');
      }

      // Verify replacement judge is assigned to this event
      const eventJudge = await tx.eventJudge.findUnique({
        where: {
          eventId_judgeId: {
            eventId: original.project.eventId,
            judgeId: newJudgeId
          }
        }
      });
      if (!eventJudge || eventJudge.status !== 'ACTIVE') {
        throw new Error('Replacement judge is not an active participant in this event');
      }

      // Verify replacement judge has no conflicts with this project
      const conflict = await tx.judgeConflict.findUnique({
        where: {
          judgeId_projectId: {
            judgeId: newJudgeId,
            projectId: original.projectId
          }
        }
      });
      if (conflict) {
        throw new Error('Replacement judge has a declared conflict with this project');
      }

      // Verify replacement judge is not already actively assigned to this project in this run
      const existing = await tx.assignment.findFirst({
        where: {
          assignmentRunId: original.assignmentRunId,
          projectId: original.projectId,
          judgeId: newJudgeId,
          state: 'ACTIVE'
        }
      });
      if (existing) {
        throw new Error('Replacement judge is already actively assigned to this project');
      }

      const now = new Date();

      // 1. Mark original assignment as DROPPED with reason and timestamp
      await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          state: string.DROPPED,
          droppedAt: now,
          replacementReason: reason.trim()
        }
      });

      // 2. Create replacement assignment linking back to original
      const newAssignment = await tx.assignment.create({
        data: {
          assignmentRunId: original.assignmentRunId,
          projectId: original.projectId,
          judgeId: newJudgeId,
          state: 'ACTIVE',
          replacedAssignmentId: original.id
        }
      });

      // 3. Emit ASSIGNMENT_REPLACED audit log
      await tx.auditLog.create({
        data: {
          actor: actorId,
          action: AuditAction.ASSIGNMENT_REPLACED,
          entity: 'Assignment',
          entityId: newAssignment.id,
          metadata: JsonField.serialize({
            eventId: original.project.eventId,
            assignmentRunId: original.assignmentRunId,
            projectId: original.projectId,
            previousAssignmentId: original.id,
            newAssignmentId: newAssignment.id,
            previousJudgeId: original.judgeId,
            newJudgeId,
            reason: reason.trim()
          })
        }
      });

      // 4. Emit ASSIGNMENT_CREATED audit log for the new assignment
      await tx.auditLog.create({
        data: {
          actor: actorId,
          action: AuditAction.ASSIGNMENT_CREATED,
          entity: 'Assignment',
          entityId: newAssignment.id,
          metadata: JsonField.serialize({
            eventId: original.project.eventId,
            assignmentRunId: original.assignmentRunId,
            projectId: original.projectId,
            judgeId: newJudgeId,
            isReplacement: true,
            replacedAssignmentId: original.id
          })
        }
      });

      return newAssignment.id;
    });
  }
}
