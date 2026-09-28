# Judging Integration Notes

This document identifies required integrations across 15 core entities. No API implementation exists yet.

## Core Models

### Event
* **Ownership:** Core T1
* **Required References:** `id`, `status`
* **Lifecycle Dependencies:** Must lock judging actions when event status is not active.
* **Immutable Fields:** ID
* **Judging-Required:** Judging configuration (e.g., K judges per project).
* **Audit-Required:** Event state changes.

### Track
* **Ownership:** Core T1
* **Required References:** `id`, `event_id`
* **Lifecycle Dependencies:** Judges/rubrics may be track-specific.
* **Immutable Fields:** ID
* **Judging-Required:** Track-specific configurations or constraints.
* **Audit-Required:** N/A

### Team
* **Ownership:** Core T1
* **Required References:** `id`, `member_ids`
* **Lifecycle Dependencies:** Team changes post-snapshot must not silently alter assignments.
* **Immutable Fields:** ID
* **Judging-Required:** Member list for conflict matrix (`TEAM_MEMBER` conflict).
* **Audit-Required:** Membership modifications during active judging.

### Project
* **Ownership:** Core T1
* **Required References:** `id`, `event_id`, `team_id`, `track_id`, `status`
* **Lifecycle Dependencies:** Changes to eligibility post-snapshot must trigger exceptions, not silent rewrites.
* **Immutable Fields:** ID
* **Judging-Required:** Project status (determines if it requires K judges).
* **Audit-Required:** Eligibility/Status changes.

### Submission
* **Ownership:** Core T1
* **Required References:** `id`, `project_id`, `submitted_at`
* **Lifecycle Dependencies:** Late submissions might invalidate or alter eligibility.
* **Immutable Fields:** `id`, `submitted_at`
* **Judging-Required:** Timestamp for deadline enforcement.
* **Audit-Required:** N/A

---

## Judging Models

### Judge
* **Ownership:** Judging Engine
* **Required References:** `id`, `user_id`, `status`
* **Lifecycle Dependencies:** Active state required for global assignment.
* **Immutable Fields:** ID, User ID
* **Judging-Required:** Declared conflicts.
* **Audit-Required:** `JUDGE_REGISTERED`.

### EventJudge (Join Model)
* **Ownership:** Judging Engine
* **Required References:** `id`, `event_id`, `judge_id`, `status`
* **Lifecycle Dependencies:** Active state required for assignment in the specific event.
* **Immutable Fields:** ID, `event_id`, `judge_id`
* **Judging-Required:** Determines event-level eligibility (`INVITED`, `ACTIVE`, `SUSPENDED`).
* **Audit-Required:** `JUDGE_INVITED`, `JUDGE_ACCEPTED`, `JUDGE_SUSPENDED`.

### AssignmentRun
* **Ownership:** Judging Engine
* **Required References:** `id`, `event_id`, `status` (RUNNING, COMPLETED, COMPLETED_WITH_EXCEPTIONS, FAILED, SUPERSEDED)
* **Lifecycle Dependencies:** Never mutated after creation; superseded by new delta runs.
* **Immutable Fields:** `id`, `created_at`, `algorithm_version`, `snapshot_payload`.
* **Judging-Required:** Frozen snapshot of all inputs.
* **Audit-Required:** `ASSIGNMENT_RUN_CREATED`.

### Assignment
* **Ownership:** Judging Engine
* **Required References:** `id`, `assignment_run_id`, `judge_id`, `project_id`, `status`
* **Lifecycle Dependencies:** Remains intact historically if a judge drops out.
* **Immutable Fields:** `id`, `judge_id`, `project_id`, `assignment_run_id`.
* **Judging-Required:** Link to active evaluation.
* **Audit-Required:** `ASSIGNMENT_CREATED`, `ASSIGNMENT_BLOCKED`, `ASSIGNMENT_REPLACED`.

### Rubric
* **Ownership:** Judging Engine
* **Required References:** `id`, `event_id`
* **Lifecycle Dependencies:** Active rubric dictates UI evaluation forms.
* **Immutable Fields:** `id`
* **Judging-Required:** Active version pointer.
* **Audit-Required:** `RUBRIC_CREATED`.

### RubricVersion
* **Ownership:** Judging Engine
* **Required References:** `id`, `rubric_id`
* **Lifecycle Dependencies:** Immutable once an evaluation uses it.
* **Immutable Fields:** ALL fields (criteria, weights).
* **Judging-Required:** Criteria definitions.
* **Audit-Required:** `RUBRIC_VERSIONED`.

### Criterion
* **Ownership:** Judging Engine
* **Required References:** `id`, `rubric_version_id`
* **Lifecycle Dependencies:** Tied to a specific RubricVersion.
* **Immutable Fields:** `weight`, `max_score`.
* **Judging-Required:** `name`, `weight`, `max_score` (sum must equal 100% at version level).
* **Audit-Required:** N/A

### Evaluation
* **Ownership:** Judging Engine
* **Required References:** `id`, `assignment_id`, `rubric_version_id`, `status` (NOT_STARTED, DRAFT, SUBMITTED)
* **Lifecycle Dependencies:** Drafts deleted on dropout; Submitted evaluations locked.
* **Immutable Fields:** `id`, `assignment_id`.
* **Judging-Required:** Ownership enforcement via authenticated judge.
* **Audit-Required:** `EVALUATION_STARTED`, `EVALUATION_SUBMITTED`, `EVALUATION_REOPENED`.

### CriterionScore
* **Ownership:** Judging Engine
* **Required References:** `id`, `evaluation_id`, `criterion_id`, `score`
* **Lifecycle Dependencies:** Locked when Evaluation is SUBMITTED.
* **Immutable Fields:** `id`, `criterion_id`.
* **Judging-Required:** Raw score validation (0 <= score <= max_score).
* **Audit-Required:** N/A

### NormalizationResult
* **Ownership:** Judging Engine
* **Required References:** `id`, `evaluation_id`, `normalization_status`
* **Lifecycle Dependencies:** Calculated dynamically or periodically based on submitted evaluation pools.
* **Immutable Fields:** `id`
* **Judging-Required:** `μ`, `σ`, Z-score (or status like ZERO_VARIANCE, INSUFFICIENT_SAMPLE).
* **Audit-Required:** `NORMALIZATION_RUN`.

### AuditLog
* **Ownership:** Core/Judging Cross-cutting
* **Required References:** `id`, `actor`, `action`, `entity`, `entity_id`, `timestamp`
* **Lifecycle Dependencies:** Append-only. Never deleted.
* **Immutable Fields:** ALL fields.
* **Judging-Required:** Payload metadata.
* **Audit-Required:** System-level retention.
