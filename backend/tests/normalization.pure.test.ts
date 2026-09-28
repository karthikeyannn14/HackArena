import {
  ZScoreNormalizationStrategy,
  ProjectAggregator,
  NormalizationService,
  NormalizationInput,
  RawEvaluation,
  MIN_NORMALIZATION_SAMPLE_SIZE,
  NormalizationStatus
} from '../src/judging/normalization';

describe('Judging Normalization Layer (Pure Tests)', () => {
  const strategy = new ZScoreNormalizationStrategy();
  const service = new NormalizationService(undefined, strategy);

  // Helper tolerance for floating point comparisons
  const EPSILON = 1e-9;

  // 1. Normal Z-score calculation
  test('1. Normal Z-score calculation with 4 evaluations', () => {
    // Scores: 60, 70, 80, 90.
    // Mean = 75. Population Variance = (( -15 )² + ( -5 )² + 5² + 15² ) / 4 = 500 / 4 = 125.
    // Population StdDev = sqrt(125) ≈ 11.18033988749895
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j1', projectId: 'p1', rawScore: 60 },
      { evaluationId: 'e2', judgeId: 'j1', projectId: 'p2', rawScore: 70 },
      { evaluationId: 'e3', judgeId: 'j1', projectId: 'p3', rawScore: 80 },
      { evaluationId: 'e4', judgeId: 'j1', projectId: 'p4', rawScore: 90 },
    ];

    const results = strategy.normalize({ evaluations });

    expect(results).toHaveLength(4);
    for (const r of results) {
      expect(r.status).toBe(NormalizationStatus.NORMALIZED);
      expect(r.strategyUsed).toBe('Z_SCORE');
    }

    const stdDev = Math.sqrt(125);
    expect(results[0]?.normalizedValue).toBeCloseTo((60 - 75) / stdDev, 8);
    expect(results[1]?.normalizedValue).toBeCloseTo((70 - 75) / stdDev, 8);
    expect(results[2]?.normalizedValue).toBeCloseTo((80 - 75) / stdDev, 8);
    expect(results[3]?.normalizedValue).toBeCloseTo((90 - 75) / stdDev, 8);

    // Verify raw score is preserved
    expect(results[0]?.rawScore).toBe(60);
    expect(results[3]?.rawScore).toBe(90);
  });

  // 2. Judge with exactly 3 evaluations
  test('2. Judge with exactly 3 evaluations satisfies MIN_NORMALIZATION_SAMPLE_SIZE', () => {
    expect(MIN_NORMALIZATION_SAMPLE_SIZE).toBe(3);

    // Scores: 70, 80, 90.
    // Mean = 80. Population Variance = ((-10)² + 0² + 10²) / 3 = 200 / 3 ≈ 66.6666667.
    // Population StdDev = sqrt(200 / 3) ≈ 8.16496580927726.
    // Note: Sample StdDev would be sqrt(200 / 2) = 10. Population MUST be used.
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j1', projectId: 'p1', rawScore: 70 },
      { evaluationId: 'e2', judgeId: 'j1', projectId: 'p2', rawScore: 80 },
      { evaluationId: 'e3', judgeId: 'j1', projectId: 'p3', rawScore: 90 },
    ];

    const results = strategy.normalize({ evaluations });

    expect(results).toHaveLength(3);
    expect(results[0]?.status).toBe(NormalizationStatus.NORMALIZED);
    expect(results[1]?.status).toBe(NormalizationStatus.NORMALIZED);
    expect(results[2]?.status).toBe(NormalizationStatus.NORMALIZED);

    const popStdDev = Math.sqrt(200 / 3);
    expect(results[0]?.normalizedValue).toBeCloseTo(-10 / popStdDev, 8);
    expect(results[1]?.normalizedValue).toBeCloseTo(0, 8);
    expect(results[2]?.normalizedValue).toBeCloseTo(10 / popStdDev, 8);

    // Ensure it did NOT use sample std dev of 10
    expect(results[0]?.normalizedValue).not.toBeCloseTo(-10 / 10, 4);
  });

  // 3. Judge with fewer than 3 evaluations
  test('3. Judge with fewer than 3 evaluations triggers INSUFFICIENT_SAMPLE and null normalized_value', () => {
    // 1 evaluation
    const singleEval: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j_one', projectId: 'p1', rawScore: 85 }
    ];
    const resSingle = strategy.normalize({ evaluations: singleEval });
    expect(resSingle).toHaveLength(1);
    expect(resSingle[0]?.status).toBe(NormalizationStatus.INSUFFICIENT_SAMPLE);
    expect(resSingle[0]?.normalizedValue).toBeNull();
    expect(resSingle[0]?.rawScore).toBe(85);

    // 2 evaluations
    const twoEvals: RawEvaluation[] = [
      { evaluationId: 'e2', judgeId: 'j_two', projectId: 'p1', rawScore: 60 },
      { evaluationId: 'e3', judgeId: 'j_two', projectId: 'p2', rawScore: 90 }
    ];
    const resTwo = strategy.normalize({ evaluations: twoEvals });
    expect(resTwo).toHaveLength(2);
    expect(resTwo[0]?.status).toBe(NormalizationStatus.INSUFFICIENT_SAMPLE);
    expect(resTwo[0]?.normalizedValue).toBeNull();
    expect(resTwo[0]?.rawScore).toBe(60);
    expect(resTwo[1]?.status).toBe(NormalizationStatus.INSUFFICIENT_SAMPLE);
    expect(resTwo[1]?.normalizedValue).toBeNull();
    expect(resTwo[1]?.rawScore).toBe(90);
  });

  // 4. Judge with zero variance
  test('4. Judge with zero variance (3+ identical scores) triggers ZERO_VARIANCE and null normalized_value', () => {
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j_const', projectId: 'p1', rawScore: 85 },
      { evaluationId: 'e2', judgeId: 'j_const', projectId: 'p2', rawScore: 85 },
      { evaluationId: 'e3', judgeId: 'j_const', projectId: 'p3', rawScore: 85 },
    ];

    const results = strategy.normalize({ evaluations });

    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.status).toBe(NormalizationStatus.ZERO_VARIANCE);
      expect(r.normalizedValue).toBeNull();
      expect(r.rawScore).toBe(85);
    }
  });

  // 5. Negative Z-score
  test('5. Score below judge mean produces negative Z-score', () => {
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j1', projectId: 'p1', rawScore: 50 },
      { evaluationId: 'e2', judgeId: 'j1', projectId: 'p2', rawScore: 80 },
      { evaluationId: 'e3', judgeId: 'j1', projectId: 'p3', rawScore: 80 },
    ];
    // Mean = 70. StdDev = sqrt((( -20 )² + 10² + 10² ) / 3) = sqrt(600 / 3) = sqrt(200) ≈ 14.142
    // Z for 50 = (50 - 70) / sqrt(200) ≈ -1.41421356
    const results = strategy.normalize({ evaluations });
    expect(results[0]?.status).toBe(NormalizationStatus.NORMALIZED);
    expect(results[0]?.normalizedValue).toBeLessThan(0);
    expect(results[0]?.normalizedValue).toBeCloseTo(-20 / Math.sqrt(200), 8);
  });

  // 6. Positive Z-score
  test('6. Score above judge mean produces positive Z-score', () => {
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j1', projectId: 'p1', rawScore: 60 },
      { evaluationId: 'e2', judgeId: 'j1', projectId: 'p2', rawScore: 60 },
      { evaluationId: 'e3', judgeId: 'j1', projectId: 'p3', rawScore: 90 },
    ];
    // Mean = 70. StdDev = sqrt(200). Z for 90 = (90 - 70) / sqrt(200) ≈ +1.41421356
    const results = strategy.normalize({ evaluations });
    expect(results[2]?.status).toBe(NormalizationStatus.NORMALIZED);
    expect(results[2]?.normalizedValue).toBeGreaterThan(0);
    expect(results[2]?.normalizedValue).toBeCloseTo(20 / Math.sqrt(200), 8);
  });

  // 7. Multiple projects evaluated by the same judge
  test('7. Multiple projects evaluated by the same judge calculate statistics across all judge scores', () => {
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j_solo', projectId: 'p1', rawScore: 70 },
      { evaluationId: 'e2', judgeId: 'j_solo', projectId: 'p2', rawScore: 80 },
      { evaluationId: 'e3', judgeId: 'j_solo', projectId: 'p3', rawScore: 90 },
    ];

    const results = strategy.normalize({ evaluations });
    expect(results).toHaveLength(3);

    const stats = strategy.calculateJudgeStats(evaluations).get('j_solo');
    expect(stats).toBeDefined();
    expect(stats!.sampleSize).toBe(3);
    expect(stats!.mean).toBe(80);
    expect(stats!.stdDev).toBeCloseTo(Math.sqrt(200 / 3), 8);

    expect(results.find(r => r.projectId === 'p1')?.normalizedValue).toBeCloseTo(-10 / Math.sqrt(200 / 3), 8);
    expect(results.find(r => r.projectId === 'p2')?.normalizedValue).toBeCloseTo(0, 8);
    expect(results.find(r => r.projectId === 'p3')?.normalizedValue).toBeCloseTo(10 / Math.sqrt(200 / 3), 8);
  });

  // 8. Project with mixed NORMALIZED + INSUFFICIENT_SAMPLE
  test('8. Project with mixed NORMALIZED + INSUFFICIENT_SAMPLE excludes insufficient evaluations from aggregate', () => {
    // J1 has 3 evaluations (NORMALIZED)
    // J2 has 2 evaluations (INSUFFICIENT_SAMPLE)
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j1', projectId: 'p_mixed', rawScore: 90 },
      { evaluationId: 'e2', judgeId: 'j1', projectId: 'p_other1', rawScore: 80 },
      { evaluationId: 'e3', judgeId: 'j1', projectId: 'p_other2', rawScore: 70 },
      // J2: only 2 evaluations
      { evaluationId: 'e4', judgeId: 'j2', projectId: 'p_mixed', rawScore: 95 },
      { evaluationId: 'e5', judgeId: 'j2', projectId: 'p_other3', rawScore: 85 },
    ];

    const normResults = strategy.normalize({ evaluations });
    const aggregates = ProjectAggregator.aggregate(normResults);

    const mixedAgg = aggregates.find(a => a.projectId === 'p_mixed');
    expect(mixedAgg).toBeDefined();
    expect(mixedAgg!.aggregationStatus).toBe('AGGREGATED');
    expect(mixedAgg!.usableEvaluationsCount).toBe(1);
    expect(mixedAgg!.totalEvaluationsCount).toBe(2);
    expect(mixedAgg!.excludedEvaluationsCount).toBe(1);

    // J1's score for p_mixed: Z = 10 / sqrt(200 / 3) ≈ 1.22474487
    const expectedZ = 10 / Math.sqrt(200 / 3);
    expect(mixedAgg!.normalizedProjectScore).toBeCloseTo(expectedZ, 8);

    // Verify J2 raw score (95) was NEVER averaged into the result
    expect(mixedAgg!.normalizedProjectScore).not.toBeCloseTo((expectedZ + 95) / 2, 2);
  });

  // 9. Project with mixed NORMALIZED + ZERO_VARIANCE
  test('9. Project with mixed NORMALIZED + ZERO_VARIANCE excludes zero-variance evaluations from aggregate', () => {
    // J1 has 3 varying evaluations (NORMALIZED)
    // J_const has 3 identical evaluations (ZERO_VARIANCE)
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j1', projectId: 'p_target', rawScore: 90 },
      { evaluationId: 'e2', judgeId: 'j1', projectId: 'p_other1', rawScore: 80 },
      { evaluationId: 'e3', judgeId: 'j1', projectId: 'p_other2', rawScore: 70 },
      // J_const: 3 identical scores
      { evaluationId: 'e4', judgeId: 'j_const', projectId: 'p_target', rawScore: 80 },
      { evaluationId: 'e5', judgeId: 'j_const', projectId: 'p_other1', rawScore: 80 },
      { evaluationId: 'e6', judgeId: 'j_const', projectId: 'p_other2', rawScore: 80 },
    ];

    const normResults = strategy.normalize({ evaluations });
    const aggregates = ProjectAggregator.aggregate(normResults);

    const targetAgg = aggregates.find(a => a.projectId === 'p_target');
    expect(targetAgg).toBeDefined();
    expect(targetAgg!.aggregationStatus).toBe('AGGREGATED');
    expect(targetAgg!.usableEvaluationsCount).toBe(1);
    expect(targetAgg!.totalEvaluationsCount).toBe(2);
    expect(targetAgg!.excludedEvaluationsCount).toBe(1);

    const expectedZ = 10 / Math.sqrt(200 / 3);
    expect(targetAgg!.normalizedProjectScore).toBeCloseTo(expectedZ, 8);
  });

  // 10. Project with no usable normalized evaluations
  test('10. Project with no usable normalized evaluations returns INSUFFICIENT_DATA and null score', () => {
    // P_unusable is only evaluated by J_insufficient (n=1) and J_const (zero variance)
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j_insufficient', projectId: 'p_unusable', rawScore: 90 },
      { evaluationId: 'e2', judgeId: 'j_const', projectId: 'p_unusable', rawScore: 85 },
      { evaluationId: 'e3', judgeId: 'j_const', projectId: 'p_other1', rawScore: 85 },
      { evaluationId: 'e4', judgeId: 'j_const', projectId: 'p_other2', rawScore: 85 },
    ];

    const normResults = strategy.normalize({ evaluations });
    const aggregates = ProjectAggregator.aggregate(normResults);

    const unusableAgg = aggregates.find(a => a.projectId === 'p_unusable');
    expect(unusableAgg).toBeDefined();
    expect(unusableAgg!.aggregationStatus).toBe('INSUFFICIENT_DATA');
    expect(unusableAgg!.normalizedProjectScore).toBeNull();
    expect(unusableAgg!.usableEvaluationsCount).toBe(0);
    expect(unusableAgg!.totalEvaluationsCount).toBe(2);
    expect(unusableAgg!.excludedEvaluationsCount).toBe(2);
  });

  // 11. Verify raw scores are never substituted into normalized aggregation
  test('11. Verify raw scores are never substituted into normalized aggregation', () => {
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j_only_raw', projectId: 'p_raw_test', rawScore: 88 }
    ];

    const normResults = strategy.normalize({ evaluations });
    const aggregates = ProjectAggregator.aggregate(normResults);

    const agg = aggregates.find(a => a.projectId === 'p_raw_test');
    expect(agg).toBeDefined();
    expect(agg!.aggregationStatus).toBe('INSUFFICIENT_DATA');
    expect(agg!.normalizedProjectScore).toBeNull();
    // Absolutely must not fall back to 88
    expect(agg!.normalizedProjectScore).not.toBe(88);
  });

  // 12. Verify no division-by-zero
  test('12. Verify no division-by-zero across empty, single, and zero-variance inputs', () => {
    // Empty input
    const emptyRes = strategy.normalize({ evaluations: [] });
    expect(emptyRes).toEqual([]);

    // Single evaluation
    const singleRes = strategy.normalize({
      evaluations: [{ evaluationId: 'e1', judgeId: 'j', projectId: 'p', rawScore: 50 }]
    });
    expect(singleRes[0]?.status).toBe(NormalizationStatus.INSUFFICIENT_SAMPLE);
    expect(singleRes[0]?.normalizedValue).toBeNull();

    // Zero variance
    const zeroVarRes = strategy.normalize({
      evaluations: [
        { evaluationId: 'e1', judgeId: 'j', projectId: 'p1', rawScore: 100 },
        { evaluationId: 'e2', judgeId: 'j', projectId: 'p2', rawScore: 100 },
        { evaluationId: 'e3', judgeId: 'j', projectId: 'p3', rawScore: 100 },
      ]
    });
    for (const r of zeroVarRes) {
      expect(r.status).toBe(NormalizationStatus.ZERO_VARIANCE);
      expect(r.normalizedValue).toBeNull();
      expect(Number.isNaN(r.normalizedValue)).toBe(false);
    }
  });

  // 13. Verify aggregation uses equal weighting
  test('13. Verify aggregation uses equal weighting between judges with different workloads', () => {
    // J_small evaluated 3 projects. Evaluates p_equal with rawScore 80 (Z ≈ 1.22474487)
    // J_large evaluated 10 projects. Mean = 55. Pop StdDev = sqrt(825) ≈ 28.7228.
    // J_large evaluates p_equal with rawScore 70 (Z = 15 / sqrt(825) ≈ 0.52223297)
    const evaluations: RawEvaluation[] = [
      // J_small
      { evaluationId: 'es1', judgeId: 'j_small', projectId: 'p_equal', rawScore: 80 },
      { evaluationId: 'es2', judgeId: 'j_small', projectId: 'ps2', rawScore: 70 },
      { evaluationId: 'es3', judgeId: 'j_small', projectId: 'ps3', rawScore: 60 },
      // J_large
      { evaluationId: 'el1', judgeId: 'j_large', projectId: 'p_equal', rawScore: 70 },
      { evaluationId: 'el2', judgeId: 'j_large', projectId: 'pl2', rawScore: 10 },
      { evaluationId: 'el3', judgeId: 'j_large', projectId: 'pl3', rawScore: 20 },
      { evaluationId: 'el4', judgeId: 'j_large', projectId: 'pl4', rawScore: 30 },
      { evaluationId: 'el5', judgeId: 'j_large', projectId: 'pl5', rawScore: 40 },
      { evaluationId: 'el6', judgeId: 'j_large', projectId: 'pl6', rawScore: 50 },
      { evaluationId: 'el7', judgeId: 'j_large', projectId: 'pl7', rawScore: 60 },
      { evaluationId: 'el8', judgeId: 'j_large', projectId: 'pl8', rawScore: 80 },
      { evaluationId: 'el9', judgeId: 'j_large', projectId: 'pl9', rawScore: 90 },
      { evaluationId: 'el10', judgeId: 'j_large', projectId: 'pl10', rawScore: 100 },
    ];

    const normResults = strategy.normalize({ evaluations });
    const aggregates = ProjectAggregator.aggregate(normResults);

    const agg = aggregates.find(a => a.projectId === 'p_equal');
    expect(agg).toBeDefined();
    expect(agg!.usableEvaluationsCount).toBe(2);

    const zSmall = 10 / Math.sqrt(200 / 3);
    const zLarge = 15 / Math.sqrt(825);
    const expectedUnweightedMean = (zSmall + zLarge) / 2;

    expect(agg!.normalizedProjectScore).toBeCloseTo(expectedUnweightedMean, 8);

    // Verify it is NOT sample-size weighted (which would be (3*zSmall + 10*zLarge) / 13)
    const weightedMean = (3 * zSmall + 10 * zLarge) / 13;
    expect(agg!.normalizedProjectScore).not.toBeCloseTo(weightedMean, 4);
  });

  // 14. Verify extreme values do not trigger hidden clipping/capping
  test('14. Verify extreme values do not trigger hidden clipping/capping to [-3, 3]', () => {
    // 17 evaluations: 16 scores of 10, and 1 extreme score of 100
    // In a population where N-1 items are equal to x and 1 item is y:
    // Population Z-score of the single outlier is mathematically EXACTLY sqrt(N - 1)
    // For N = 17: sqrt(17 - 1) = sqrt(16) = 4.0!
    const evaluations: RawEvaluation[] = [];
    for (let i = 1; i <= 16; i++) {
      evaluations.push({
        evaluationId: `e${i}`,
        judgeId: 'j_outlier',
        projectId: `p${i}`,
        rawScore: 10
      });
    }
    evaluations.push({
      evaluationId: 'e17',
      judgeId: 'j_outlier',
      projectId: 'p_extreme',
      rawScore: 100
    });

    const results = strategy.normalize({ evaluations });
    const extremeResult = results.find(r => r.projectId === 'p_extreme');

    expect(extremeResult).toBeDefined();
    expect(extremeResult!.status).toBe(NormalizationStatus.NORMALIZED);
    // Must be exactly 4.0, proving no clipping to [-3, 3] or [-2, 2] occurred
    expect(extremeResult!.normalizedValue).toBeCloseTo(4.0, 8);
    expect(extremeResult!.normalizedValue).toBeGreaterThan(3.0);
  });

  // 15. Verify deterministic results for identical inputs
  test('15. Verify deterministic results for identical inputs across multiple runs', () => {
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j1', projectId: 'p1', rawScore: 65 },
      { evaluationId: 'e2', judgeId: 'j1', projectId: 'p2', rawScore: 75 },
      { evaluationId: 'e3', judgeId: 'j1', projectId: 'p3', rawScore: 85 },
      { evaluationId: 'e4', judgeId: 'j2', projectId: 'p1', rawScore: 70 },
      { evaluationId: 'e5', judgeId: 'j2', projectId: 'p2', rawScore: 80 },
      { evaluationId: 'e6', judgeId: 'j2', projectId: 'p3', rawScore: 90 },
    ];

    const run1 = service.executeInMemory({ evaluations }, ['p1', 'p2', 'p3']);
    const run2 = service.executeInMemory({ evaluations }, ['p1', 'p2', 'p3']);

    expect(run1.evaluationResults).toEqual(run2.evaluationResults);
    expect(run1.projectAggregates).toEqual(run2.projectAggregates);
    expect(Array.from(run1.judgeStats.entries())).toEqual(Array.from(run2.judgeStats.entries()));
  });

  // 16. Swappable NormalizationStrategy support
  test('16. Service supports swappable strategy without altering aggregation logic', () => {
    // Custom mock Min-Max strategy to verify strategy replaceable architecture
    const mockMinMaxStrategy = {
      name: 'MOCK_MIN_MAX',
      normalize(input: NormalizationInput) {
        return input.evaluations.map(e => ({
          evaluationId: e.evaluationId,
          judgeId: e.judgeId,
          projectId: e.projectId,
          rawScore: e.rawScore,
          normalizedValue: e.rawScore >= 80 ? 1.0 : 0.0,
          status: NormalizationStatus.NORMALIZED,
          strategyUsed: 'MOCK_MIN_MAX'
        }));
      }
    };

    const customService = new NormalizationService(undefined, mockMinMaxStrategy);
    const evaluations: RawEvaluation[] = [
      { evaluationId: 'e1', judgeId: 'j1', projectId: 'p1', rawScore: 80 },
      { evaluationId: 'e2', judgeId: 'j2', projectId: 'p1', rawScore: 60 },
    ];

    const output = customService.executeInMemory({ evaluations }, ['p1']);
    expect(output.strategyUsed).toBe('MOCK_MIN_MAX');
    expect(output.projectAggregates[0]?.normalizedProjectScore).toBeCloseTo(0.5, 8);
  });

  // 17. Projects with zero evaluations return INSUFFICIENT_DATA
  test('17. Target project with zero submitted evaluations returns INSUFFICIENT_DATA and null score', () => {
    const output = service.executeInMemory({ evaluations: [] }, ['p_empty']);
    expect(output.projectAggregates).toHaveLength(1);
    expect(output.projectAggregates[0]?.projectId).toBe('p_empty');
    expect(output.projectAggregates[0]?.aggregationStatus).toBe('INSUFFICIENT_DATA');
    expect(output.projectAggregates[0]?.normalizedProjectScore).toBeNull();
    expect(output.projectAggregates[0]?.usableEvaluationsCount).toBe(0);
    expect(output.projectAggregates[0]?.totalEvaluationsCount).toBe(0);
  });
});
