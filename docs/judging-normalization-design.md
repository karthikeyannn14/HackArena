# Judging Normalization Design

**NORMALIZATION STATUS: IMPLEMENTED (Phase 5 Complete)**

This document evaluates and records the score normalization strategies and final pipeline implementation for fair project evaluation.

## 1. Normalization Interface / Pipeline

The architecture defines a replaceable normalization interface. The implementation must support a pipeline structure:

```text
RawEvaluation 
  → NormalizationStrategy 
    → NormalizationResult 
      → ProjectAggregation
```

The `NormalizationStrategy` must remain fully swappable.

---

## 2. Methods Compared

### A. Z-Score (Research Candidate)
* **Formula:** `Z = (score - μ) / σ`
* **Definitions:** `μ` = mean of judge's raw scores, `σ` = population standard deviation of judge's raw scores.
* **Magnitude Preservation:** High. It preserves relative distances between scores.
* **Interpretability:** Medium. Outputs are standard deviations (e.g., +1.5, -0.2).
* **Implementation Complexity:** Medium.

### B. Min-Max Normalization
* **Formula:** `Normalized = (score - Min) / (Max - Min)`
* **Magnitude Preservation:** High, but completely constrained to the `[0,1]` bounds.
* **Outliers:** Highly vulnerable. A single extreme outlier squashes all other scores into a microscopic band.
* **Interpretability:** High (easily mapped to 0-100%).
* **Implementation Complexity:** Low.

### C. Percentile / Rank Normalization
* **Formula:** `Percentile = Rank(score) / TotalEvaluations` *(Ties use average rank / midrank)*
* **Magnitude Preservation:** None. Distance information is destroyed.
* **Outliers:** Extremely robust. Outliers only consume the top/bottom rank.
* **Interpretability:** High (percentile).
* **Implementation Complexity:** Medium.

---

## 3. Behavior by Sample Size (N)

**Policy: `MIN_NORMALIZATION_SAMPLE_SIZE = 3`**

* **n = 1:** Standard deviation (`σ`) is undefined (population std dev is 0). `Min-Max` denominator is 0. `Percentile` is 100%. `normalization_status = INSUFFICIENT_SAMPLE`.
* **n = 2:** `σ` exists, but Z-scores will mirror each other (e.g., +1 and -1) regardless of the actual raw score gap. `Min-Max` always yields 1.0 and 0.0. `normalization_status = INSUFFICIENT_SAMPLE`.
* **n >= 3:** Normalization mathematical assumptions begin to function. Normalization applied.

---

## 4. Small Sample / Zero Variance Aggregation Analysis

### 4.1. INSUFFICIENT_SAMPLE (n < 3)
* **Mathematical Consequences of Mixing:** If we silently substitute raw scores into a normalized aggregate pool (e.g., taking an average where J1 is a Z-score of +1.5 and J2 is a raw score of 80), the mathematics become meaningless.
* **Decision:** **PENDING VALIDATION**. We will not silently substitute raw scores.

### 4.2. ZERO_VARIANCE (σ = 0 or identical scores)
* **The Problem:** The judge gave exactly the same score to every project.
* **Decision:** **PENDING VALIDATION**. We will explicitly record `normalization_status = ZERO_VARIANCE` and prevent division by zero. We will not silently substitute the raw score into the Z-score aggregate.

---

## 5. Edge Cases Summary

* **Unequal judge workloads:** A judge evaluating 3 projects versus a judge evaluating 15 projects have vastly different statistical stability. Without mathematical weighting, naive aggregation risks punishing/rewarding projects randomly based on sample size. Weighting formula status: **PENDING PRODUCT/MATHEMATICAL VALIDATION**. Do NOT invent a weighting formula yet.
* **Extreme Outlier:** Z-score's `μ` and `σ` will be heavily skewed by a single massive outlier, potentially compressing the normalized scores of the judge's other, normally-rated projects into a narrow band.

---

## 6. Final Normalization Decisions (Phase 5 Implementation)

### NORMALIZATION DECISION
FINAL / IMPLEMENTED (`backend/src/judging/normalization`)

### SELECTED METHOD
Z-score with Population Standard Deviation:
$$Z = \frac{\text{score} - \mu}{\sigma}, \quad \sigma = \sqrt{\frac{1}{N} \sum_{i=1}^N (x_i - \mu)^2}$$

### SMALL SAMPLE POLICY
`MIN_NORMALIZATION_SAMPLE_SIZE = 3`.
$N < 3$ triggers `normalization_status = INSUFFICIENT_SAMPLE` and `normalized_value = null`. Raw score preserved; excluded from project aggregation.

### ZERO VARIANCE POLICY
$N \ge 3$ and $\sigma = 0$ triggers `normalization_status = ZERO_VARIANCE` and `normalized_value = null`. Division by zero prevented; raw score preserved; excluded from project aggregation.

### AGGREGATION POLICY
Project aggregation strictly includes ONLY `NORMALIZED` evaluations with valid finite values. Missing normalized values are NEVER substituted with raw scores.
* If usable evaluations exist ($K_{\text{usable}} > 0$): unweighted arithmetic mean $\frac{1}{K_{\text{usable}}} \sum Z_i$, `aggregation_status = AGGREGATED`.
* If no usable evaluations exist ($K_{\text{usable}} = 0$): `aggregation_status = INSUFFICIENT_DATA`, `normalized_project_score = null`. No fallback score invented.

### WEIGHTING POLICY
Equal weighting ($1 / K_{\text{usable}}$). Workload/sample-size weighting (e.g. $w=n$, $w=\sqrt{n}$) is explicitly NOT implemented in this phase.

### OUTLIER POLICY
Standard Z-score without artificial clipping, winsorization, or capping. Extreme outliers naturally affect the judge's $\mu$ and $\sigma$.

### ROUNDING POLICY
Full IEEE-754 floating-point precision retained throughout the pipeline. No intermediate rounding. Storage values remain unrounded.

### FUTURE DECISIONS / OPEN QUESTIONS
* Whether sample-size/confidence weighting or Bayesian shrinkage should ever be introduced.
