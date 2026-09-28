# Judging Engine Specification

Version: 0.2
Status: Draft
Owners: Judging Engine Team

## 1. Purpose
The judging engine provides a robust, self-hostable evaluation system for the Dogfood 2026 hackathon platform. It is designed to manage judges, assign projects based on customizable rubrics, prevent conflict of interest, and generate normalized scores. It ensures fairness and auditability in the final scoring of projects without relying on external cloud services.

## 2. Actors
* **Organizer**: Configures the event judging phase, manages rubrics, invites judges, oversees assignment runs, resolves conflict flags, and exports results.
* **Judge**: Accepts invitations, reviews assigned projects, submits scores via rubrics, and declares conflicts.
* **Participant**: Submits projects for evaluation. Has no direct interaction with the judging engine other than receiving final scores/feedback (if configured).
* **Administrator**: Has global oversight of the self-hosted platform, capable of managing all underlying resources and system settings.

## 3. Judging Entities
The future logical entities are defined as follows:
* `Judge`
* `JudgeInvitation`
* `JudgeConflict`
* `JudgeAssignment`
* `AssignmentRun`
* `Rubric`
* `Criterion`
* `Evaluation`
* `EvaluationScore`
* `NormalizedScore`
* `AuditEvent`

## 4. Judge Management
* **Lifecycle**: `INVITED` → `ACTIVE` → `SUSPENDED` → `REMOVED`. A judge is invited, accepts the invitation to become active, can be suspended by organizers, or removed completely. A removed judge cannot be reactivated via normal lifecycle; a suspended judge can be reactivated.
* **Event-Scoped**: Judge membership is strictly bound to an `Event`. A judge in Event A has no default access to Event B.
* **Invitation**: Organizers invite judges locally. Duplicate active/invited statuses are prevented.
* **Activation**: Judges must authenticate and accept their own invitation. A judge cannot accept another judge's invitation.
* **Suspension/Removal**: Organizers (Admins) can temporarily suspend or permanently remove a judge, preventing new assignments and evaluations.
* **Authorization Boundary**: Participants cannot manage judges. Organizers manage invitations and suspensions. Judges can only accept their own invitations and declare their own conflicts.

## 5. Conflict Model
To ensure fairness, a judge must never be assigned to a conflicted project. Minimum conflict types:
* `OWN_PROJECT`: Judge is somehow associated with the project.
* `OWN_TEAM`: Judge is a member of the team.
* `DECLARED`: Judge manually declares a conflict of interest.
* `PROHIBITED_RELATIONSHIP`: Known relationship blocking objective review.

If insufficient eligible judges exist, the system must NOT silently violate the conflict rule. The project must be flagged for organizer intervention.

**Historical Immutability**: If a conflict is declared after an assignment run already exists, the historical `AssignmentRun` is not mutated. The conflict flags the active assignment for organizer handling, and the active assignment remains intact until a reassignment workflow takes place.
## 6. Assignment Requirements
Given:
* P = number of projects
* J = number of judges
* K = judges required per project

Total evaluations:
* N = P × K

Approximate average workload:
* N / J

The system must balance workloads across judges as evenly as possible while respecting conflict constraints.

## 7. Deterministic Assignment
The assignment algorithm must be reproducible given identical inputs:
1. Build conflict matrix.
2. Sort projects deterministically by `project_id`.
3. Sort judges deterministically by `judge_id`.
4. Track judge workload.
5. For each project:
   * remove conflicted/ineligible judges
   * verify at least K eligible judges exist
   * select eligible judges with lowest workload
   * use `judge_id` as deterministic tie-breaker
   * assign K judges
   * increment workload
6. Persist assignment run metadata.

### Greedy Assignment Dead-End
A project may individually have K eligible judges, but earlier greedy assignments can consume judges in a way that leaves a later project with fewer than K eligible judges. Therefore the implementation must not assume that `eligible_judges(project) >= K` for every project independently guarantees global assignment feasibility.

The future implementation must either:
* use a globally feasibility-aware assignment strategy, or
* detect a greedy dead-end and perform deterministic repair/backtracking/reassignment.

*(Do NOT implement this yet.)*

## 8. Assignment Run
Assignment history must be preserved for auditability, debugging, and resolving disputes.

At the beginning of an assignment run, the system should conceptually capture a deterministic snapshot of:
* eligible judges
* projects
* teams/relationships relevant to conflicts
* declared conflicts
* judges_per_project
* algorithm version

The assignment must be calculated against that snapshot. Changes occurring after the snapshot must not silently alter the current assignment run. This is necessary for reproducibility and auditability.

Required metadata for an assignment run:
* `assignment_run_id`
* `algorithm_version`
* `seed` if applicable
* `event_id`
* `judge_count`
* `project_count`
* `judges_per_project`
* `created_at`
* `created_by`
* `status` (Must be one of: `RUNNING`, `COMPLETED`, `COMPLETED_WITH_EXCEPTIONS`, `FAILED`, `SUPERSEDED`)

## 9. Judging Freeze / Configuration Integrity
Once an assignment/judging run is active, changes affecting:
* team membership
* project eligibility
* judge eligibility
* judge conflicts
* rubric version
* judges_per_project

must not silently invalidate historical assignments/evaluations. Such changes must either:
* be blocked, or
* trigger an explicit audited reassignment/versioning workflow.

*(Do not implement this yet.)*

## 10. Judge Dropout/Reassignment
If a judge drops out or is removed:
* Historical assignments must NOT be deleted.
* A replacement/reassignment must be completely auditable.
* The system should reassign incomplete evaluations to a new eligible judge, preserving the deterministic nature where possible or logging it as a manual/delta assignment.

## 11. Rubric Model
Entities:
* `Rubric`
* `Criterion`

Each criterion should conceptually support:
* `name`
* `description`
* `weight`
* `max_score`
* `display_order`
* `required`

Criterion weights must sum to 100%. Invalid configurations must be rejected by the backend.

## 12. Evaluation Model
States:
* `NOT_STARTED`
* `DRAFT`
* `SUBMITTED`

A judge can only evaluate a project if:
* they are authenticated
* they are an active judge
* they are assigned to the project
* they have no applicable conflict
* judging is open
* the evaluation belongs to them

Backend enforcement of these rules is mandatory.

## 13. Raw Score Calculation
Conceptual weighted calculation:
`criterion contribution = (score / max_score) × criterion weight`

Then:
`raw_score = Σ criterion contributions`

If weights sum to 1:
`0 <= raw_score <= 1`

Presentation may convert this to a percentage. The original criterion scores and rubric version used must be preserved.

## 14. Rubric Versioning
Once judging begins, the rubric used by evaluations must be immutable.
Changes create a new rubric version. Historical evaluations must retain the rubric version they used.

## 15. Normalization

**NORMALIZATION STATUS: IMPLEMENTED (Z-Score with Population Standard Deviation)**

The normalization layer implements an uncoupled pipeline:
`RawEvaluation → NormalizationStrategy → NormalizationResult → ProjectAggregation`

### 15.1 Mathematical Strategy: Z-Score
For each judge with eligible submitted evaluations:
* $\mu$ = arithmetic mean of the judge's submitted raw scores:
  $$\mu = \frac{1}{N} \sum_{i=1}^N x_i$$
* $\sigma$ = population standard deviation of that judge's submitted raw scores:
  $$\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^N (x_i - \mu)^2}$$
  *(Note: Population standard deviation divided by $N$ is strictly used, NOT sample standard deviation $N - 1$.)*
* Z-score:
  $$Z = \frac{\text{rawScore} - \mu}{\sigma}$$

### 15.2 Locked Policies
1. **Minimum Sample Size (`MIN_NORMALIZATION_SAMPLE_SIZE = 3`)**:
   * If a judge has fewer than 3 eligible submitted evaluations ($N < 3$), `normalization_status = INSUFFICIENT_SAMPLE` and `normalized_value = null`.
   * Raw scores are never substituted for missing normalized values.
   * Evaluations with insufficient sample size are excluded from normalized project aggregates.
2. **Zero Variance**:
   * If a judge has 3+ eligible evaluations but all scores are identical ($\sigma = 0$), `normalization_status = ZERO_VARIANCE` and `normalized_value = null`.
   * Division by zero is strictly prevented.
   * Raw scores are never substituted into normalized project aggregates.
3. **Normalized Evaluation**:
   * If $N \ge 3$ and $\sigma > 0$, `normalization_status = NORMALIZED` and `normalized_value = Z`.
   * The original raw score is preserved unchanged.
4. **Project Aggregation Rule**:
   * For each project, include ONLY evaluations with `normalization_status = NORMALIZED` and a non-null, finite normalized value.
   * Exclude `INSUFFICIENT_SAMPLE`, `ZERO_VARIANCE`, `UNAVAILABLE`, and `FAILED` evaluations.
   * Never mix raw scores with Z-scores.
   * If usable normalized evaluations exist ($K_{\text{usable}} > 0$), calculate the unweighted arithmetic mean:
     $$\text{normalized\_project\_score} = \frac{1}{K_{\text{usable}}} \sum_{i=1}^{K_{\text{usable}}} Z_i$$
   * If zero usable normalized evaluations exist ($K_{\text{usable}} = 0$), return `aggregation_status = INSUFFICIENT_DATA` and `normalized_project_score = null`. Do not invent a fallback score.
5. **Equal Weighting (No Sample-Size Weighting)**:
   * Every valid normalized evaluation carries equal weight ($1 / K_{\text{usable}}$).
   * Explicitly, no judge sample-size weighting (e.g. $w = n$, $w = \sqrt{n}$, or confidence weighting) is applied in this phase.
6. **No Outlier Clipping**:
   * Standard Z-scores are computed without clipping, winsorization, or caps (e.g. values exceeding $\pm 3.0$ are preserved).
   * Extreme outliers naturally influence the judge's $\mu$ and $\sigma$.
7. **Precision and Rounding**:
   * Full IEEE-754 64-bit floating point precision is retained internally and in storage.
   * No intermediate rounding is performed. Rounding is restricted solely to external presentation/export boundaries where explicitly specified.

### 15.3 Known Limitations and Statistical Considerations
* **Small-Sample Stability**: At minimal sample sizes ($N = 3$ to $5$), normalization is statistically volatile; a single extreme evaluation can significantly shift $\mu$ and compress or inflate $\sigma$.
* **Non-Removal of All Bias**: Normalization adjusts for linear scale differences (mean severity and dispersion) among judges. It does not "perfectly remove judge bias", correct for non-linear scoring habits, or guarantee absolute fairness.
* **Future Policy Decisions**: Whether sample-size confidence weighting, shrinkage estimators (e.g. empirical Bayes), or global baseline anchoring should ever be introduced remains a deferred product decision.

## 16. Edge Cases
The system must explicitly handle:
* identical scores (zero variance)
* zero variance
* one evaluation (no meaningful std deviation)
* two evaluations
* extreme outlier
* unequal judge workloads
* judge dropout
* insufficient judges
* insufficient eligible judges
* conflict-heavy project
* all judges conflicted
* invalid rubric
* invalid score
* duplicate evaluation
* submitted evaluation modification
* reassignment after judging starts
* greedy assignment dead-end (global assignment feasibility)

## 17. Auditability
Every audit record should identify: `actor`, `action`, `entity`, `entity_id`, `timestamp`, `metadata`.

Audit requirements for:
* `JUDGE_INVITED`
* `JUDGE_ACCEPTED`
* `JUDGE_CONFLICT_DECLARED`
* `JUDGE_CONFLICT_REMOVED`
* `ASSIGNMENT_RUN_CREATED`
* `ASSIGNMENT_CREATED`
* `ASSIGNMENT_BLOCKED`
* `ASSIGNMENT_REPLACED`
* `RUBRIC_CREATED`
* `RUBRIC_VERSIONED`
* `EVALUATION_STARTED`
* `EVALUATION_SUBMITTED`
* `EVALUATION_REOPENED`
* `NORMALIZATION_RUN`
* `CSV_EXPORTED`

## 18. CSV Export
Exports must be generated locally without external services.

### Evaluation export
* `event_id`, `project_id`, `project_name`, `judge_id`, `evaluation_id`, `rubric_version`, `criterion_id`, `criterion_name`, `criterion_weight`, `criterion_max_score`, `criterion_score`, `raw_score`, `submitted_at`

### Project result export
* `event_id`, `project_id`, `project_name`, `judge_count`, `raw_average`, `normalized_average`, `final_score`

### Assignment export
* `assignment_run_id`, `event_id`, `project_id`, `judge_id`, `assignment_status`, `conflict_checked`, `assigned_at`

## 19. Acceptance Tests

### Assignment
* A1 Basic assignment
* A2 Workload balancing
* A3 Deterministic repeatability
* A4 Conflict protection
* A5 Insufficient eligible judges
* A6 Self/team conflict
* A7 Judge dropout
* A8 Greedy dead-end / global feasibility
* A9 Assignment snapshot reproducibility

### Normalization
* N1 Basic Z-score
* N2 Identical scores / zero variance
* N3 Single evaluation
* N4 Two evaluations
* N5 Three evaluations
* N6 Extreme outlier
* N7 Unequal workload
* N8 Overlapping projects
* N9 Small-sample warning

*(Document expected mathematical behavior only. Do not write implementation code for these tests yet.)*

## 20. Phase 6A: Audit Foundation & Immutable Judging History

### Audit Event Taxonomy
A centralized taxonomy of `AuditAction` ensures consistency across the judging lifecycle. Events include judge actions (`JUDGE_INVITED`, `JUDGE_ACCEPTED`, `JUDGE_CONFLICT_DECLARED`), assignment runs (`ASSIGNMENT_RUN_CREATED`, `ASSIGNMENT_BLOCKED`, `ASSIGNMENT_CREATED`, `ASSIGNMENT_REPLACED`), rubric versioning (`RUBRIC_CREATED`, `RUBRIC_VERSION_CREATED`), evaluation states (`EVALUATION_STARTED`, `EVALUATION_SUBMITTED`, `EVALUATION_REOPENED`), and normalization (`NORMALIZATION_RUN`).

### Audit Querying
The read-only `AuditService` supports querying the audit trail for specific entities, event-associated logs, or actor history with deterministic chronological ordering. The service provides non-destructive filtering by action or date range.

### Evaluation Reopening
Submitted evaluations can be reopened exclusively through an explicit organizer-controlled workflow, transitioning them back to a draft state. This action emits an `EVALUATION_REOPENED` event and strictly preserves the original submission timestamp and history. Judges cannot reopen their own evaluations.

### Assignment Lineage
When a judge is replaced on an assignment, the original assignment is preserved and marked as dropped, recording the timestamp and replacement reason. A new assignment is created linking back to the original via a replaced assignment ID.

### Individual Assignment Audit Records
In addition to the `ASSIGNMENT_RUN_CREATED` event, individual `ASSIGNMENT_CREATED` audit logs are emitted for every assignment created during a run or replacement, complete with traceable metadata for the event, project, and judge. This guarantees high granularity traceability.

### Data Protections
**Application-Level Protections (Implemented):**
* `AuditService` enforces read-only access to audit logs.
* Submitted evaluations are blocked from modification in standard judge workflows.
* Reopening requires explicit organizer API access.
* Historical assignments are preserved and marked dropped instead of deleted.

**Database-Level Protections (NOT Implemented):**
* No raw PostgreSQL row-level security or triggers are currently implemented.
* There is no cryptographic tamper-proofing on the audit log schema.
* Direct malicious database access can still bypass immutability guarantees.

## Requirements Traceability Table

| Requirement | Source | Specification section | Implementation status | Test status |
| ----------- | ------ | --------------------- | --------------------- | ----------- |
| Judge invitation | Spec | 4. Judge Management | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Judge assignment | Spec | 6 & 7. Assignment | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Conflict prevention | Spec | 5. Conflict Model | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Workload balancing | Spec | 6. Assignment Requirements | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Deterministic assignment | Spec | 7. Deterministic Assignment | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Weighted rubric | Spec | 11. Rubric Model | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Backend role isolation | Spec | 12. Evaluation Model | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Evaluation | Spec | 12. Evaluation Model | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Normalization | Spec | 15. Normalization | IMPLEMENTED | TESTED |
| Judge progress | Spec | 12. Evaluation Model | NOT IMPLEMENTED | NOT IMPLEMENTED |
| CSV export | Spec | 18. CSV Export | NOT IMPLEMENTED | NOT IMPLEMENTED |
| Auditability | Spec | 17. Auditability | NOT IMPLEMENTED | NOT IMPLEMENTED |
