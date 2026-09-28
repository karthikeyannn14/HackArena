# Normalization Research

**NORMALIZATION DECISION: PENDING VALIDATION**

This document compares methods for normalizing judge scores to ensure fair final evaluation of projects. 

## Methods Compared
### Method A: Z-score (RESEARCH CANDIDATE — NOT YET FINAL)
* **Formula**: Z = (score - μ) / σ
* **Where**: μ = mean of a judge's submitted raw scores, σ = population standard deviation of that judge's submitted raw scores
* **Mathematical Behavior**: Z-score removes judge-specific mean and scale differences under the assumption that these differences represent systematic scoring severity rather than meaningful differences in evaluation.

### Method B: Min-Max Normalization
* **Formula**: Normalized(j,p) = (S(j,p) - Min(j)) / (Max(j) - Min(j))
* **Mathematical Behavior**: Scales all scores to a fixed [0, 1] range.

### Method C: Percentile/Rank Normalization
* **Formula**: Percentile(j,p) = Rank(S(j,p)) / TotalEvaluations(j) *(Uses midrank for ties)*
* **Mathematical Behavior**: Converts scores into their relative rank among all scores given by that judge. It is sensitive to sample size and loses magnitude/distance information between scores.

---

## Scenario Testing

### Scenario 1 — Similar judges
* Judge A: 70, 75, 80, 85
* Judge B: 72, 76, 81, 84
* **Z-score**: Normalizes both sets to standard distributions, removing the slight severity differences between judges.
* **Min-Max**: Both are mapped to [0,1], masking any actual magnitude differences.
* **Percentile**: Preserves rank order perfectly but loses distance information between scores.

### Scenario 2 — Strict vs generous judge
* Judge A: 80, 85, 90, 95
* Judge B: 50, 55, 60, 65
* **Z-score**: Removes judge-specific mean differences under the assumption these are due to systematic severity bias.
* **Min-Max**: Also aligns both judges to [0,1], correcting the baseline bias.
* **Percentile**: Ranks match perfectly.

### Scenario 3 — Identical scores
* Scores: 50, 50, 50, 50
* **Z-score**: **Fails** (Zero-variance problem). σ = 0, causing division by zero. Sets `normalization_status = ZERO_VARIANCE`. The system must preserve the raw score while separately recording the failure/warning (does not silently substitute the raw score into a normalized aggregate).
* **Min-Max**: **Fails**. Max(j) - Min(j) = 0, causing division by zero.
* **Percentile**: All rank the same (using midrank), producing identical percentile values depending on N.

### Scenario 4 — Extreme outlier
* Scores: 90, 88, 91, 87, 20
* **Z-score**: The outlier drastically increases σ and shifts μ, suppressing the relative differences among the normal scores.
* **Min-Max**: Highly susceptible to the outlier, compressing all non-outlier scores into a tiny range near 1.0.
* **Percentile**: Very robust. The outlier simply ranks last without distorting the distance between the other scores (though distance information is already lost).

### Scenario 5 — Unequal workloads
* Judge A → 10 projects
* Judge B → 5 projects
* Judge C → 2 projects
* **Z-score**: Judge C has a very small sample size. Using `MIN_NORMALIZATION_SAMPLE_SIZE = 3`, Judge C receives `normalization_status = INSUFFICIENT_SAMPLE`. System does not silently convert their raw score into a normalized score.
* **Min-Max**: Judge C's scores are mapped to 0 and 1, exaggerating differences regardless of quality.
* **Percentile**: Highly sensitive to sample size. Judge C's scores will just be extreme percentiles.

### Scenario 6 — Small sample
* Judge A → 1 evaluation
* Judge B → 2 evaluations
* **Z-score**: Both A and B have fewer than 3 evaluations. Both receive `normalization_status = INSUFFICIENT_SAMPLE`.
* **Min-Max**: Both would be fundamentally flawed.
* **Percentile**: Would yield trivial ranks that lack statistical value.

### Scenario 7 — Multiple judges evaluating overlapping projects

Judge J1:
* P1 = 90
* P2 = 80
* P3 = 85
* P4 = 95

Judge J2:
* P1 = 75
* P3 = 70
* P4 = 80
* P5 = 78

Judge J3:
* P2 = 60
* P3 = 65
* P4 = 70
* P5 = 62

* **Z-score**: Uses population standard deviation and mean to transform scores across overlap. J1 seems generous overall, J3 strict. Normalization shifts J3's scores higher and J1's scores lower in aggregated context, aiming to capture true relative differences across overlapping projects P3 and P4.
* **Min-Max**: Will squash J3's narrower range [60, 70] to [0,1] just like J1's wider range [80, 95], which may over-penalize/reward based on the extremes.
* **Percentile**: Computes relative midranks independently for J1, J2, J3, then aggregates. Since magnitude info is lost, J3 rating P2 low (60) versus P4 high (70) simply becomes rank ordering, missing how *much* better P4 is than P2 in J3's eyes.

---

## RESEARCH OBSERVATION
All dynamic normalization methods have vulnerabilities. Z-score removes systematic severity bias but requires explicit handling for `ZERO_VARIANCE` and `INSUFFICIENT_SAMPLE` (N < 3). Percentile loses magnitude information and is sensitive to sample size. Min-max is extremely vulnerable to outliers. Final method selection pending validation testing.
## 7. Final Normalization Validation

### 7.1 Compare the Candidates

**A. Per-judge Z-score**
* Formula: `z = (x - μ) / σ`
* Preserves relative magnitudes but is heavily influenced by the standard deviation. A single outlier inflates σ, compressing the Z-scores of all normal evaluations.

**B. Per-judge Min-Max**
* Formula: `(x - min) / (max - min)`
* Extremely sensitive to outliers. A single severe outlier establishes the 0 (or 1) bound, squashing all other evaluations into a tiny numeric band. 

**C. Per-judge Percentile**
* Formula: `Rank / N`
* Perfectly robust to outliers, but completely destroys the magnitude of differences. A difference of 1 point and 50 points between ranks are treated identically.

### 7.2 Small Sample Policy
* **n = 1:** Mean equals the score. Variance is 0. Mathematical normalization is impossible (division by zero). Result must be `INSUFFICIENT_SAMPLE`. Raw score preserved, normalized value `null`.
* **n = 2:** While mathematically possible, results are statistically meaningless. Z-scores will invariably lock to `+1` and `-1` (population) regardless of the scores' actual proximity. Result must be `INSUFFICIENT_SAMPLE`. Raw score preserved, normalized value `null`.
* **n >= 3:** The absolute minimum threshold for a variance calculation to represent a distribution. Result is `NORMALIZED`.

### 7.3 Zero Variance Policy
* **Input:** `[80, 80, 80]`
* **Math:** σ = 0. Z-score and Min-Max require division by zero. 
* **Policy:** Must be caught before division. Status = `ZERO_VARIANCE`. Normalized numeric value = `null`. Cannot participate in strict normalized aggregations.

### 7.4 Outlier Analysis
* **Scores:** `[90, 88, 91, 87, 20]`
* **Z-score:** Mean = 75.2, σ = 27.67. Z-scores: `+0.53, +0.46, +0.57, +0.42, -1.99`. The outlier compresses the 87-91 range into a tight ~0.15 band.
* **Min-Max:** Min = 20, Max = 91. The 87-91 range is compressed into `0.94 - 1.0`. The outlier dictates the entire scale.
* **Percentile:** Ranks are uniformly distributed (20%, 40%, 60%, 80%, 100%). The massive 67-point gap between 20 and 87 is treated exactly the same as the 1-point gap between 87 and 88.

### 7.5 Final Project Aggregation & Statistical Limitations
A project's final score cannot safely average Z-scores if some evaluations are `INSUFFICIENT_SAMPLE` or `ZERO_VARIANCE`. Substituting raw scores into a Z-score average is mathematically invalid. Weighting Judge A (15 evals) vs Judge B (3 evals) introduces arbitrary bias unless Bayesian shrinkage is applied. 
**Aggregation Policy remains strictly PENDING.**

---

NORMALIZATION DECISION:
PENDING

SELECTED METHOD:
Z-score (Recommended but PENDING validation of aggregation policy)

SMALL SAMPLE POLICY:
n < 3 triggers INSUFFICIENT_SAMPLE. Normalized value = null.

ZERO VARIANCE POLICY:
σ = 0 triggers ZERO_VARIANCE. Normalized value = null.

AGGREGATION POLICY:
PENDING

OUTLIER POLICY:
PENDING (Z-score compresses normal scores when severe outliers exist)

ROUNDING POLICY:
PENDING

REMAINING QUESTIONS:
How to aggregate projects with mixed INSUFFICIENT_SAMPLE, ZERO_VARIANCE, and NORMALIZED scores?
How to weight J_count = 3 vs J_count = 15?
