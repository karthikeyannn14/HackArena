/**
 * Phase 6A: Centralized Audit Actions and Metadata Types
 *
 * Defines the canonical AuditAction taxonomy for all judging lifecycle events.
 */

export const AuditAction = {
  // Judge Lifecycle
  JUDGE_INVITED: 'JUDGE_INVITED',
  JUDGE_ACCEPTED: 'JUDGE_ACCEPTED',
  JUDGE_SUSPENDED: 'JUDGE_SUSPENDED',
  JUDGE_REACTIVATED: 'JUDGE_REACTIVATED',
  JUDGE_REMOVED: 'JUDGE_REMOVED',

  // Conflicts
  JUDGE_CONFLICT_DECLARED: 'JUDGE_CONFLICT_DECLARED',
  JUDGE_CONFLICT_REMOVED: 'JUDGE_CONFLICT_REMOVED',

  // Assignments
  ASSIGNMENT_RUN_CREATED: 'ASSIGNMENT_RUN_CREATED',
  ASSIGNMENT_BLOCKED: 'ASSIGNMENT_BLOCKED',
  ASSIGNMENT_CREATED: 'ASSIGNMENT_CREATED',
  ASSIGNMENT_REPLACED: 'ASSIGNMENT_REPLACED',

  // Rubrics
  RUBRIC_CREATED: 'RUBRIC_CREATED',
  RUBRIC_VERSION_CREATED: 'RUBRIC_VERSION_CREATED',
  RUBRIC_VERSION_PUBLISHED: 'RUBRIC_VERSION_PUBLISHED',

  // Evaluations
  EVALUATION_STARTED: 'EVALUATION_STARTED',
  EVALUATION_DRAFT_SAVED: 'EVALUATION_DRAFT_SAVED',
  EVALUATION_SUBMITTED: 'EVALUATION_SUBMITTED',
  EVALUATION_REOPENED: 'EVALUATION_REOPENED',

  // Normalization
  NORMALIZATION_RUN: 'NORMALIZATION_RUN',

  // Exports
  CSV_EXPORTED: 'CSV_EXPORTED'
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

/**
 * Filter options for querying audit history.
 */
export interface AuditQueryFilter {
  action?: AuditAction | string;
  actions?: (AuditAction | string)[];
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Standard Audit Log record shape.
 */
export interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: Date;
  metadata: Record<string, unknown> | null;
}
