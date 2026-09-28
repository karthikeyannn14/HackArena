export const AssignmentRunStatus = {
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  COMPLETED_WITH_EXCEPTIONS: 'COMPLETED_WITH_EXCEPTIONS',
  FAILED: 'FAILED',
  SUPERSEDED: 'SUPERSEDED'
} as const;
export type AssignmentRunStatus = typeof AssignmentRunStatus[keyof typeof AssignmentRunStatus];

export const AssignmentState = {
  ACTIVE: 'ACTIVE',
  SUPERSEDED: 'SUPERSEDED',
  DROPPED: 'DROPPED'
} as const;
export type AssignmentState = typeof AssignmentState[keyof typeof AssignmentState];

export const EvaluationStatus = {
  NOT_STARTED: 'NOT_STARTED',
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED'
} as const;
export type EvaluationStatus = typeof EvaluationStatus[keyof typeof EvaluationStatus];

export const EventJudgeStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  REMOVED: 'REMOVED'
} as const;
export type EventJudgeStatus = typeof EventJudgeStatus[keyof typeof EventJudgeStatus];

export const ConflictReason = {
  DECLARED: 'DECLARED',
  PROHIBITED_RELATIONSHIP: 'PROHIBITED_RELATIONSHIP',
  OWN_TEAM: 'OWN_TEAM',
  OWN_PROJECT: 'OWN_PROJECT'
} as const;
export type ConflictReason = typeof ConflictReason[keyof typeof ConflictReason];
