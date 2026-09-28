import { AssignmentSnapshot } from './types';
import { ConflictChecker } from './ConflictChecker';

export class FeasibilityAnalyzer {
  /**
   * Pre-flight checks on the snapshot to identify obvious impossibility BEFORE 
   * entering a complex optimization algorithm.
   */
  public static analyze(snapshot: AssignmentSnapshot): { isFeasible: boolean; reason?: string } {
    if (snapshot.kValue <= 0) {
      return { isFeasible: false, reason: 'K must be greater than 0' };
    }

    if (snapshot.eligibleProjects.length > 0 && snapshot.eligibleJudges.length === 0) {
      return { isFeasible: false, reason: 'Zero eligible judges available for projects' };
    }

    if (snapshot.eligibleJudges.length < snapshot.kValue) {
      return { 
        isFeasible: false, 
        reason: `Global total of eligible judges (${snapshot.eligibleJudges.length}) is fewer than K (${snapshot.kValue})`
      };
    }

    const conflictChecker = new ConflictChecker(snapshot);

    // Verify each project individually has at least K un-conflicted judges
    for (const project of snapshot.eligibleProjects) {
      let unconflictedCount = 0;

      for (const judge of snapshot.eligibleJudges) {
        if (!conflictChecker.hasConflict(judge.judgeId, project.projectId)) {
          unconflictedCount++;
        }
      }

      if (unconflictedCount < snapshot.kValue) {
        return {
          isFeasible: false,
          reason: `Project ${project.projectId} only has ${unconflictedCount} eligible judges after conflicts (needs ${snapshot.kValue})`
        };
      }
    }

    // Note: Individual K-satisfaction does NOT guarantee global feasibility. 
    // That requires the actual assignment strategy.
    return { isFeasible: true };
  }
}
