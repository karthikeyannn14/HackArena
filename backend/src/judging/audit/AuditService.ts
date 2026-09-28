import { PrismaClient, Prisma, AuditLog } from '@prisma/client';
import { AuditQueryFilter } from './types';
import { JsonField } from '../utils/JsonField';

/**
 * Read-Only Audit Service
 *
 * Provides dedicated querying capabilities for judging audit history.
 * Guarantees:
 * - Read-only: No create, update, or delete methods exposed.
 * - Deterministic chronological ordering: Ordered by timestamp ASC, id ASC.
 * - Non-destructive: Records are never mutated during query execution.
 *
 * SQLite note: metadata is stored as a JSON string. JSON-path queries are
 * not supported by SQLite, so getEventAuditLogs fetches all candidate rows
 * and filters in-process. For a hackathon-scale dataset this is acceptable.
 */
export class AuditService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves the audit trail for a specific entity instance.
   */
  public async getAuditTrail(
    entity: string,
    entityId: string,
    filter?: AuditQueryFilter
  ): Promise<AuditLog[]> {
    const where: Prisma.AuditLogWhereInput = {
      entity,
      entityId,
      ...this.buildFilterConditions(filter)
    };

    return this.prisma.auditLog.findMany({
      where,
      orderBy: [
        { timestamp: 'asc' },
        { id: 'asc' }
      ],
      take: filter?.limit ?? undefined,
      skip: filter?.offset ?? undefined
    });
  }

  /**
   * Retrieves all audit logs associated with an event.
   * SQLite: metadata JSON-path filtering is done in-process after fetching.
   */
  public async getEventAuditLogs(
    eventId: string,
    filter?: AuditQueryFilter
  ): Promise<AuditLog[]> {
    // Fetch logs directly related to the event entity
    const directLogs = await this.prisma.auditLog.findMany({
      where: {
        entity: 'Event',
        entityId: eventId,
        ...this.buildFilterConditions(filter)
      },
      orderBy: [{ timestamp: 'asc' }, { id: 'asc' }]
    });

    // Also fetch all other logs that might reference eventId in metadata (in-process filter)
    const allOtherLogs = await this.prisma.auditLog.findMany({
      where: {
        NOT: { entity: 'Event' },
        ...this.buildFilterConditions(filter)
      },
      orderBy: [{ timestamp: 'asc' }, { id: 'asc' }]
    });

    const indirectLogs = allOtherLogs.filter(log => {
      const meta = JsonField.deserialize<Record<string, unknown>>(log.metadata as string | null);
      return meta?.eventId === eventId;
    });

    // Merge, deduplicate, sort
    const merged = new Map<string, AuditLog>();
    for (const log of [...directLogs, ...indirectLogs]) {
      merged.set(log.id, log);
    }

    const result = [...merged.values()].sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });

    const offset = filter?.offset ?? 0;
    return filter?.limit !== undefined
      ? result.slice(offset, offset + filter.limit)
      : result.slice(offset);
  }

  /**
   * Retrieves all audit logs initiated by a specific actor/user.
   */
  public async getActorHistory(
    actorId: string,
    filter?: AuditQueryFilter
  ): Promise<AuditLog[]> {
    const where: Prisma.AuditLogWhereInput = {
      actor: actorId,
      ...this.buildFilterConditions(filter)
    };

    return this.prisma.auditLog.findMany({
      where,
      orderBy: [
        { timestamp: 'asc' },
        { id: 'asc' }
      ],
      take: filter?.limit ?? undefined,
      skip: filter?.offset ?? undefined
    });
  }

  /**
   * Pure in-memory filtering and sorting helper.
   */
  public static filterRecords(
    records: ReadonlyArray<AuditLog>,
    filter?: AuditQueryFilter
  ): AuditLog[] {
    let result = [...records];

    if (filter?.action) {
      result = result.filter(r => r.action === filter.action);
    }
    if (filter?.actions && filter.actions.length > 0) {
      const allowed = new Set(filter.actions);
      result = result.filter(r => allowed.has(r.action));
    }
    if (filter?.from) {
      const fromTime = filter.from.getTime();
      result = result.filter(r => r.timestamp.getTime() >= fromTime);
    }
    if (filter?.to) {
      const toTime = filter.to.getTime();
      result = result.filter(r => r.timestamp.getTime() <= toTime);
    }

    result.sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });

    const offset = filter?.offset ?? 0;
    const limit = filter?.limit !== undefined ? offset + filter.limit : undefined;

    return result.slice(offset, limit);
  }

  /**
   * Lightweight integrity verification on a set of AuditLog records.
   */
  public static verifyAuditIntegrity(records: AuditLog[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    let previousTimestamp = 0;
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record) continue;
      
      if (!record.id || !record.actor || !record.action || !record.entity || !record.entityId || !record.timestamp) {
        errors.push(`Record ${record.id || i} missing required fields.`);
      }
      
      const currentTimestamp = record.timestamp instanceof Date ? record.timestamp.getTime() : new Date(record.timestamp).getTime();
      
      if (currentTimestamp < previousTimestamp) {
        errors.push(`Chronological ordering violated at record ${record.id || i}.`);
      }
      
      // metadata is now a JSON string in SQLite; validate it can be parsed if present
      if (record.metadata !== null && record.metadata !== undefined) {
        const metaStr = record.metadata as unknown as string;
        if (typeof metaStr === 'string') {
          try { JSON.parse(metaStr); } catch {
            errors.push(`Record ${record.id || i} has invalid metadata JSON.`);
          }
        }
      }
      
      previousTimestamp = currentTimestamp;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Constructs Prisma where conditions for filters.
   */
  private buildFilterConditions(filter?: AuditQueryFilter): Prisma.AuditLogWhereInput {
    const conditions: Prisma.AuditLogWhereInput = {};

    if (filter?.action) {
      conditions.action = filter.action;
    } else if (filter?.actions && filter.actions.length > 0) {
      conditions.action = { in: filter.actions };
    }

    if (filter?.from || filter?.to) {
      conditions.timestamp = {};
      if (filter.from) conditions.timestamp.gte = filter.from;
      if (filter.to) conditions.timestamp.lte = filter.to;
    }

    return conditions;
  }
}
