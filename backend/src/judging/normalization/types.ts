/**
 * Locked Policy: Minimum number of eligible submitted evaluations
 * required for a judge's scores to be normalized.
 */
export const MIN_NORMALIZATION_SAMPLE_SIZE = 3;

/**
 * Status of project-level aggregation.
 */
export type ProjectAggregationStatus = 'AGGREGATED' | 'INSUFFICIENT_DATA';

export const NormalizationStatus = {
  NORMALIZED: 'NORMALIZED',
  INSUFFICIENT_SAMPLE: 'INSUFFICIENT_SAMPLE',
  ZERO_VARIANCE: 'ZERO_VARIANCE',
  UNAVAILABLE: 'UNAVAILABLE',
  FAILED: 'FAILED'
} as const;
export type NormalizationStatus = typeof NormalizationStatus[keyof typeof NormalizationStatus];

/**
 * An individual raw evaluation ready for normalization.
 */
export interface RawEvaluation {
  readonly evaluationId: string;
  readonly judgeId: string;
  readonly projectId: string;
  readonly rawScore: number;
}

/**
 * Input to a normalization strategy.
 */
export interface NormalizationInput {
  readonly evaluations: ReadonlyArray<RawEvaluation>;
}

/**
 * Per-judge scoring statistics calculated by a normalization strategy.
 */
export interface JudgeNormalizationStats {
  readonly judgeId: string;
  readonly sampleSize: number;
  readonly mean: number | null;
  readonly stdDev: number | null; // Population standard deviation for Z-score
  readonly status: string;
  readonly rawScores?: ReadonlyArray<number>;
}

/**
 * Per-evaluation normalization result.
 * Preserves original rawScore and records normalization status.
 */
export interface NormalizationResult {
  readonly evaluationId: string;
  readonly judgeId: string;
  readonly projectId: string;
  readonly rawScore: number;
  readonly normalizedValue: number | null;
  readonly status: string;
  readonly strategyUsed: string;
  readonly metadata?: any;
}

/**
 * Result of aggregating normalized scores for a single project.
 */
export interface ProjectAggregationResult {
  readonly projectId: string;
  readonly aggregationStatus: ProjectAggregationStatus;
  readonly normalizedProjectScore: number | null;
  readonly usableEvaluationsCount: number;
  readonly totalEvaluationsCount: number;
  readonly excludedEvaluationsCount: number;
  readonly evaluations: ReadonlyArray<NormalizationResult>;
  readonly metadata?: any;
}

/**
 * Output of a complete normalization run (evaluations + project aggregates + judge stats).
 */
export interface NormalizationRunOutput {
  readonly strategyUsed: string;
  readonly evaluationResults: NormalizationResult[];
  readonly projectAggregates: ProjectAggregationResult[];
  readonly judgeStats: Map<string, JudgeNormalizationStats>;
}

/**
 * Swappable normalization strategy contract.
 */
export interface NormalizationStrategy {
  /**
   * Unique name of the strategy (e.g. 'Z_SCORE', 'MIN_MAX', 'PERCENTILE').
   */
  readonly name: string;

  /**
   * Normalizes raw evaluations according to this strategy's mathematical rules.
   * MUST be deterministic and pure (no database I/O).
   */
  normalize(input: NormalizationInput): NormalizationResult[];

  /**
   * Optional helper to calculate judge statistics for this strategy.
   */
  calculateJudgeStats?(evaluations: ReadonlyArray<RawEvaluation>): Map<string, JudgeNormalizationStats>;
}
