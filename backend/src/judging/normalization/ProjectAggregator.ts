import { JsonField } from '../utils/JsonField';
import {
  NormalizationResult,
  ProjectAggregationResult,
  ProjectAggregationStatus
} from './types';

/**
 * ProjectAggregator
 *
 * Aggregates per-evaluation normalization results to the project level.
 *
 * Locked Policies:
 * 1. Filtering: Include ONLY evaluations with status === NORMALIZED and a non-null, finite normalizedValue.
 * 2. Exclusion: Exclude INSUFFICIENT_SAMPLE, ZERO_VARIANCE, UNAVAILABLE, and FAILED evaluations.
 * 3. No Mixing: Never mix raw scores with normalized scores. Never silently substitute raw scores.
 * 4. Insufficient Data: If zero usable normalized evaluations exist for a project, return:
 *    - aggregationStatus = 'INSUFFICIENT_DATA'
 *    - normalizedProjectScore = null
 *    No fallback score is invented.
 * 5. Arithmetic Mean: If usable evaluations exist, calculate the unweighted arithmetic mean.
 * 6. Equal Weighting: Every valid normalized evaluation has equal influence (1 / usableCount).
 *    Explicitly no sample-size or confidence weighting (e.g. no n, sqrt(n), or bayesian weighting).
 * 7. Precision: Full IEEE-754 precision is retained with no intermediate rounding.
 */
export class ProjectAggregator {
  /**
   * Aggregates normalization results per project.
   *
   * @param normalizationResults Array of per-evaluation normalization results.
   * @param targetProjectIds Optional list of project IDs to guarantee inclusion (even with 0 evaluations).
   * @returns Array of ProjectAggregationResult deterministically ordered by projectId.
   */
  public static aggregate(
    normalizationResults: ReadonlyArray<NormalizationResult>,
    targetProjectIds?: ReadonlyArray<string>
  ): ProjectAggregationResult[] {
    const evalsByProject = new Map<string, NormalizationResult[]>();

    // Seed target projects if provided
    if (targetProjectIds) {
      for (const pid of targetProjectIds) {
        evalsByProject.set(pid, []);
      }
    }

    // Group evaluations by projectId
    for (const r of normalizationResults) {
      if (!evalsByProject.has(r.projectId)) {
        evalsByProject.set(r.projectId, []);
      }
      evalsByProject.get(r.projectId)!.push(r);
    }

    const results: ProjectAggregationResult[] = [];

    // Process deterministically sorted by projectId
    const sortedProjectIds = Array.from(evalsByProject.keys()).sort();

    for (const projectId of sortedProjectIds) {
      const projectEvals = evalsByProject.get(projectId)!;

      // Filter ONLY NORMALIZED evaluations with valid float values
      const usableEvals = projectEvals.filter(
        e => e.status === 'NORMALIZED' &&
             e.normalizedValue !== null &&
             typeof e.normalizedValue === 'number' &&
             Number.isFinite(e.normalizedValue)
      );

      const totalCount = projectEvals.length;
      const usableCount = usableEvals.length;
      const excludedCount = totalCount - usableCount;

      if (usableCount === 0) {
        results.push({
          projectId,
          aggregationStatus: 'INSUFFICIENT_DATA' as ProjectAggregationStatus,
          normalizedProjectScore: null,
          usableEvaluationsCount: 0,
          totalEvaluationsCount: totalCount,
          excludedEvaluationsCount: excludedCount,
          evaluations: projectEvals,
          metadata: JsonField.serialize({
            reason: totalCount === 0
              ? 'No evaluations submitted for project'
              : 'All evaluations were excluded due to small sample size, zero variance, or invalid state'
          })
        });
      } else {
        // Unweighted arithmetic mean: Σ Z / usableCount
        const sumZ = usableEvals.reduce((sum, e) => sum + e.normalizedValue!, 0);
        const meanZ = sumZ / usableCount;

        results.push({
          projectId,
          aggregationStatus: 'AGGREGATED' as ProjectAggregationStatus,
          normalizedProjectScore: meanZ,
          usableEvaluationsCount: usableCount,
          totalEvaluationsCount: totalCount,
          excludedEvaluationsCount: excludedCount,
          evaluations: projectEvals,
          metadata: JsonField.serialize({
            aggregationMethod: 'ARITHMETIC_MEAN_EQUAL_WEIGHT',
            usableZScores: usableEvals.map(e => e.normalizedValue!)
          })
        });
      }
    }

    return results;
  }
}
