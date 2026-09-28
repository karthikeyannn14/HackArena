/**
 * Phase 1B: Assignment Engine Contracts
 * 
 * Defines the immutable inputs, typed outputs, and the strict strategy interface
 * for the Judging Assignment Engine.
 */

export interface JudgeSnapshot {
  readonly judgeId: string;
  readonly teamId?: string; // Optional: The team this judge is associated with
  readonly ownProjectId?: string; // Explicit mapping for own-project conflict
}

export interface ProjectSnapshot {
  readonly projectId: string;
  readonly teamId: string;
}

export interface ConflictSnapshot {
  readonly judgeId: string;
  readonly projectId: string;
  readonly reason: 'DECLARED' | 'PROHIBITED_RELATIONSHIP' | 'OWN_TEAM' | 'OWN_PROJECT';
}

export interface AssignmentSnapshot {
  readonly assignmentRunId: string;
  readonly algorithmVersion: string;
  readonly deterministicSeed: string;
  readonly kValue: number;
  readonly eligibleJudges: ReadonlyArray<JudgeSnapshot>;
  readonly eligibleProjects: ReadonlyArray<ProjectSnapshot>;
  readonly conflicts: ReadonlyArray<ConflictSnapshot>;
  readonly judgingConfiguration?: Record<string, unknown>; // Relevant judging config
}

export interface AssignmentOutput {
  projectId: string;
  judgeId: string;
}

export interface ProjectAssignmentStatus {
  projectId: string;
  isResolved: boolean;
  assignedCount: number;
  requiredCount: number;
  missingCount: number;
}

export interface JudgeWorkload {
  judgeId: string;
  assignedCount: number;
}

export interface AssignmentResult {
  assignmentRunId: string;
  algorithmVersion: string;
  assignments: AssignmentOutput[];
  projectStatuses: ProjectAssignmentStatus[];
  judgeWorkloads: JudgeWorkload[];
  unresolvedProjects: ProjectAssignmentStatus[];
  deterministicSeedUsed: string;
  isGloballyFeasible: boolean;
}

export interface AssignmentStrategy {
  /**
   * Executes the assignment logic deterministically using the provided immutable snapshot.
   * MUST NOT perform external I/O (e.g. database queries).
   */
  assign(snapshot: Readonly<AssignmentSnapshot>): AssignmentResult;
}
