import { AssignmentSnapshot, JudgeSnapshot, ProjectSnapshot, ConflictSnapshot } from './types';

export class ConflictChecker {
  private explicitConflicts: Set<string>;
  private judgeMap: Map<string, JudgeSnapshot>;
  private projectMap: Map<string, ProjectSnapshot>;

  constructor(snapshot: AssignmentSnapshot) {
    this.explicitConflicts = new Set();
    this.judgeMap = new Map();
    this.projectMap = new Map();

    for (const judge of snapshot.eligibleJudges) {
      this.judgeMap.set(judge.judgeId, judge);
    }

    for (const project of snapshot.eligibleProjects) {
      this.projectMap.set(project.projectId, project);
    }

    // Hash explicit conflicts for O(1) lookup
    for (const conflict of snapshot.conflicts) {
      this.explicitConflicts.add(this.getConflictKey(conflict.judgeId, conflict.projectId));
    }
  }

  private getConflictKey(judgeId: string, projectId: string): string {
    return `${judgeId}::${projectId}`;
  }

  /**
   * Evaluates whether a judge is strictly conflicted with a project based on
   * documented hard constraints.
   */
  public hasConflict(judgeId: string, projectId: string): boolean {
    // 1. Check Explicit/Declared/Prohibited Conflicts
    if (this.explicitConflicts.has(this.getConflictKey(judgeId, projectId))) {
      return true;
    }

    const judge = this.judgeMap.get(judgeId);
    const project = this.projectMap.get(projectId);

    if (!judge || !project) {
      // Missing reference implies a bad snapshot, effectively untrustworthy mapping.
      return true;
    }

    // 2. Check Implicit Own-Team Conflict
    if (judge.teamId && project.teamId && judge.teamId === project.teamId) {
      return true;
    }

    // 3. Check Implicit Own-Project Conflict
    if (judge.ownProjectId && judge.ownProjectId === project.projectId) {
      return true;
    }

    return false;
  }
}
