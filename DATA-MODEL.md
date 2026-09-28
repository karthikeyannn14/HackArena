# Judging Data Model

This document outlines the core entities and relationships implemented for the Judging Engine (Phase 1A).

## Core Application Entities

### 1. Event
* **Purpose:** Represents a hackathon event.
* **Important Fields:** `id`, `name`, `createdAt`
* **Relationships:** Has many `Tracks`, `Projects`, `AssignmentRuns`, `Rubrics`, `EventJudges`.
* **Database Constraints:** Primary key `id`.

### 2. Track
* **Purpose:** Represents a specific track/category within an event.
* **Important Fields:** `id`, `name`, `eventId`
* **Relationships:** Belongs to `Event`. Has many `Projects`.
* **Database Constraints:** Foreign key to `Event`.

### 3. Team
* **Purpose:** Represents a group of participants.
* **Important Fields:** `id`, `name`
* **Relationships:** Has many `Projects`.

### 4. Project
* **Purpose:** A submission entity evaluated by judges.
* **Important Fields:** `id`, `name`, `eventId`, `trackId`, `teamId`
* **Relationships:** Belongs to `Event`, `Track`, `Team`. Has many `Submissions`, `Assignments`, `Conflicts`.
* **Database Constraints:** Foreign keys to `Event`, `Track`, `Team`.

### 5. Submission
* **Purpose:** The actual deliverable for a project.
* **Important Fields:** `id`, `projectId`, `submittedAt`
* **Relationships:** Belongs to `Project`.
* **Database Constraints:** Foreign key to `Project`.

## Judging Entities

### 6. Judge
* **Purpose:** A user eligible to evaluate projects globally.
* **Important Fields:** `id`, `userId`, `isActive`, `teamId`, `createdAt`
* **Relationships:** Belongs to `Team` (optional). Has many `Assignments`, `EventJudges`, `Conflicts`.
* **Database Constraints:** `userId` must be unique (maps to external user system).

### 6.1 EventJudge (Join Model)
* **Purpose:** Explicitly scopes a judge to participate in a specific event.
* **Important Fields:** `id`, `eventId`, `judgeId`, `status`, `invitedAt`
* **Relationships:** Belongs to `Event` and `Judge`.
* **Database Constraints:** 
  * `UNIQUE(eventId, judgeId)` to prevent duplicate invitations.
  * `status` restricted to enum (`INVITED`, `ACTIVE`, `SUSPENDED`, `REMOVED`).

### 6.2 JudgeConflict
* **Purpose:** Explicitly models prohibited relationships between a judge and a project.
* **Important Fields:** `id`, `judgeId`, `projectId`, `reason`
* **Relationships:** Belongs to `Judge` and `Project`.
* **Database Constraints:**
  * `UNIQUE(judgeId, projectId)`.
  * `reason` restricted to enum (`DECLARED`, `PROHIBITED_RELATIONSHIP`).

### 7. AssignmentRun
* **Purpose:** Immutable record of an algorithmic assignment execution.
* **Important Fields:** `id`, `eventId`, `status`, `algorithmVersion`, `kValue`, `snapshotPayload`
* **Relationships:** Belongs to `Event`. Has many `Assignments`.
* **Database Constraints:** `status` is restricted to enum (`RUNNING`, `COMPLETED`, `COMPLETED_WITH_EXCEPTIONS`, `FAILED`, `SUPERSEDED`).
* **Application Constraints:** `snapshotPayload` (JSONB) must freeze all inputs (eligibility, K, conflicts, teams).

### 8. Assignment
* **Purpose:** A mapping between a judge and a project.
* **Important Fields:** `id`, `assignmentRunId`, `projectId`, `judgeId`, `state`
* **Relationships:** Belongs to `AssignmentRun`, `Project`, `Judge`. Has one `Evaluation`.
* **Database Constraints:** 
  * `UNIQUE(assignmentRunId, projectId, judgeId)` to prevent duplicate assignments per run.
  * `state` restricted to enum (`ACTIVE`, `SUPERSEDED`, `DROPPED`).

### 9. Rubric & 10. RubricVersion
* **Purpose:** Defines the evaluation criteria structure.
* **Important Fields:** `id`, `name` (Rubric); `version` (RubricVersion).
* **Relationships:** `Rubric` belongs to `Event` and has many `RubricVersions`. `RubricVersion` has many `Criteria`.
* **Database Constraints:** `UNIQUE(rubricId, version)`.

### 11. Criterion
* **Purpose:** A specific scorable metric in a rubric.
* **Important Fields:** `id`, `rubricVersionId`, `name`, `weight`, `maxScore`, `displayOrder`, `isRequired`
* **Relationships:** Belongs to `RubricVersion`. Has many `CriterionScores`.
* **Database Constraints:** Foreign key to `RubricVersion`.
* **Application Constraints:** `weight`s must sum to 100% at the `RubricVersion` level.

### 12. Evaluation
* **Purpose:** The container for a judge's assessment of an assigned project.
* **Important Fields:** `id`, `assignmentId`, `rubricVersionId`, `status`, `rawScore`, `submittedAt`
* **Relationships:** Belongs to `Assignment`, `RubricVersion`. Has many `CriterionScores`. Has one `NormalizationResult`.
* **Database Constraints:** 
  * `UNIQUE(assignmentId)` ensuring one evaluation per assignment.
  * `status` restricted to enum (`NOT_STARTED`, `DRAFT`, `SUBMITTED`).

### 13. CriterionScore
* **Purpose:** The individual score given for a specific criterion.
* **Important Fields:** `id`, `evaluationId`, `criterionId`, `score`
* **Relationships:** Belongs to `Evaluation`, `Criterion`.
* **Database Constraints:** 
  * `UNIQUE(evaluationId, criterionId)` ensuring only one score per criterion per evaluation.
* **Application Constraints:** `score` must not exceed `Criterion.maxScore`.

### 14. NormalizationResult
* **Purpose:** Stores the processed relative score output, agnostic of the strategy used.
* **Important Fields:** `id`, `evaluationId`, `status`, `strategyUsed`, `resultValue`, `metadata`
* **Relationships:** Belongs to `Evaluation`.
* **Database Constraints:** 
  * `UNIQUE(evaluationId)`.
  * `status` restricted to enum (`NORMALIZED`, `INSUFFICIENT_SAMPLE`, `ZERO_VARIANCE`, `UNAVAILABLE`, `FAILED`).

### 15. AuditLog
* **Purpose:** Immutable ledger of significant judging operations.
* **Important Fields:** `id`, `actor`, `action`, `entity`, `entityId`, `timestamp`, `metadata`
* **Database Constraints:** Append-only logic enforced by application.
