import { JsonField } from '../utils/JsonField';
import {
  NormalizationStrategy,
  NormalizationInput,
  NormalizationResult,
  JudgeNormalizationStats,
  RawEvaluation,
  MIN_NORMALIZATION_SAMPLE_SIZE
} from './types';

/**
 * Z-Score Normalization Strategy
 *
 * Implements Z-score normalization using population standard deviation:
 * Z = (rawScore - judgeMean) / judgePopulationStdDev
 *
 * Locked Policies:
 * 1. Minimum Sample Size: If judge has fewer than 3 evaluations, status is INSUFFICIENT_SAMPLE
 *    and normalizedValue is null.
 * 2. Zero Variance: If judge has 3+ evaluations but population std dev is 0, status is ZERO_VARIANCE
 *    and normalizedValue is null (no division by zero).
 * 3. Normalized Evaluation: If sample size >= 3 and std dev > 0, status is NORMALIZED and
 *    normalizedValue is the computed Z-score.
 * 4. Raw Score Preservation: The original rawScore is always preserved and never substituted.
 * 5. Outliers: No arbitrary clipping, capping, or winsorization is performed.
 * 6. Precision: Full IEEE-754 floating point precision is retained without intermediate rounding.
 */
export class ZScoreNormalizationStrategy implements NormalizationStrategy {
  public readonly name = 'Z_SCORE';

  /**
   * Calculates statistics per judge from eligible raw evaluations.
   */
  public calculateJudgeStats(evaluations: ReadonlyArray<RawEvaluation>): Map<string, JudgeNormalizationStats> {
    const evalsByJudge = new Map<string, RawEvaluation[]>();

    for (const e of evaluations) {
      if (!evalsByJudge.has(e.judgeId)) {
        evalsByJudge.set(e.judgeId, []);
      }
      evalsByJudge.get(e.judgeId)!.push(e);
    }

    const statsMap = new Map<string, JudgeNormalizationStats>();

    for (const [judgeId, judgeEvals] of evalsByJudge.entries()) {
      const validScores = judgeEvals
        .map(e => e.rawScore)
        .filter(score => typeof score === 'number' && Number.isFinite(score));

      const n = validScores.length;

      if (n < MIN_NORMALIZATION_SAMPLE_SIZE) {
        statsMap.set(judgeId, {
          judgeId,
          sampleSize: n,
          mean: n > 0 ? validScores.reduce((sum, s) => sum + s, 0) / n : null,
          stdDev: null,
          status: 'INSUFFICIENT_SAMPLE',
          rawScores: validScores
        });
        continue;
      }

      // Calculate Arithmetic Mean
      const sum = validScores.reduce((acc, s) => acc + s, 0);
      const mean = sum / n;

      // Check for zero variance / identical scores
      const allEqual = validScores.every(s => s === validScores[0]);
      if (allEqual) {
        statsMap.set(judgeId, {
          judgeId,
          sampleSize: n,
          mean,
          stdDev: 0,
          status: 'ZERO_VARIANCE',
          rawScores: validScores
        });
        continue;
      }

      // Calculate Population Variance: Σ (x - μ)² / N
      const sumSquaredDiffs = validScores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0);
      const populationVariance = sumSquaredDiffs / n;

      if (populationVariance <= 0) {
        statsMap.set(judgeId, {
          judgeId,
          sampleSize: n,
          mean,
          stdDev: 0,
          status: 'ZERO_VARIANCE',
          rawScores: validScores
        });
        continue;
      }

      const populationStdDev = Math.sqrt(populationVariance);

      statsMap.set(judgeId, {
        judgeId,
        sampleSize: n,
        mean,
        stdDev: populationStdDev,
        status: 'NORMALIZED',
        rawScores: validScores
      });
    }

    return statsMap;
  }

  /**
   * Normalizes raw evaluations into NormalizationResults.
   */
  public normalize(input: NormalizationInput): NormalizationResult[] {
    const judgeStats = this.calculateJudgeStats(input.evaluations);
    const results: NormalizationResult[] = [];

    for (const evaluation of input.evaluations) {
      if (typeof evaluation.rawScore !== 'number' || !Number.isFinite(evaluation.rawScore)) {
        results.push({
          evaluationId: evaluation.evaluationId,
          judgeId: evaluation.judgeId,
          projectId: evaluation.projectId,
          rawScore: evaluation.rawScore,
          normalizedValue: null,
          status: 'UNAVAILABLE',
          strategyUsed: this.name,
          metadata: JsonField.serialize({
            reason: 'Raw score is non-numeric or non-finite'
          })
        });
        continue;
      }

      const stats = judgeStats.get(evaluation.judgeId);

      if (!stats) {
        results.push({
          evaluationId: evaluation.evaluationId,
          judgeId: evaluation.judgeId,
          projectId: evaluation.projectId,
          rawScore: evaluation.rawScore,
          normalizedValue: null,
          status: 'FAILED',
          strategyUsed: this.name,
          metadata: JsonField.serialize({
            reason: 'Missing judge statistics'
          })
        });
        continue;
      }

      if (stats.status === 'INSUFFICIENT_SAMPLE') {
        results.push({
          evaluationId: evaluation.evaluationId,
          judgeId: evaluation.judgeId,
          projectId: evaluation.projectId,
          rawScore: evaluation.rawScore,
          normalizedValue: null,
          status: 'INSUFFICIENT_SAMPLE',
          strategyUsed: this.name,
          metadata: JsonField.serialize({
            judgeSampleSize: stats.sampleSize,
            minSampleSizeRequired: MIN_NORMALIZATION_SAMPLE_SIZE
          })
        });
      } else if (stats.status === 'ZERO_VARIANCE') {
        results.push({
          evaluationId: evaluation.evaluationId,
          judgeId: evaluation.judgeId,
          projectId: evaluation.projectId,
          rawScore: evaluation.rawScore,
          normalizedValue: null,
          status: 'ZERO_VARIANCE',
          strategyUsed: this.name,
          metadata: JsonField.serialize({
            judgeSampleSize: stats.sampleSize,
            judgeMean: stats.mean,
            judgePopulationStdDev: 0
          })
        });
      } else if (stats.status === 'NORMALIZED' && stats.mean !== null && stats.stdDev !== null && stats.stdDev > 0) {
        // Standard Z-Score: Z = (score - μ) / σ
        const zScore = (evaluation.rawScore - stats.mean) / stats.stdDev;

        results.push({
          evaluationId: evaluation.evaluationId,
          judgeId: evaluation.judgeId,
          projectId: evaluation.projectId,
          rawScore: evaluation.rawScore,
          normalizedValue: zScore,
          status: 'NORMALIZED',
          strategyUsed: this.name,
          metadata: JsonField.serialize({
            judgeSampleSize: stats.sampleSize,
            judgeMean: stats.mean,
            judgePopulationStdDev: stats.stdDev
          })
        });
      } else {
        results.push({
          evaluationId: evaluation.evaluationId,
          judgeId: evaluation.judgeId,
          projectId: evaluation.projectId,
          rawScore: evaluation.rawScore,
          normalizedValue: null,
          status: 'FAILED',
          strategyUsed: this.name,
          metadata: JsonField.serialize({
            reason: 'Unexpected judge statistics state'
          })
        });
      }
    }

    return results;
  }
}
