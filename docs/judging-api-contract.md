# Judging API Contract

The Judging API provides a single, coherent RESTful interface for the Dogfood 2026 frontend to interact with the backend judging engine. All endpoints expect and return `application/json`.

## Response Contract
All responses follow a predictable structure:

**Success Shape:**
```json
{
  "success": true,
  "data": { ... } // Or null if no data
}
```

**Error Shape:**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST | NOT_FOUND | UNAUTHORIZED | SERVER_ERROR",
    "message": "Human readable message"
  }
}
```

## Authentication & Authorization
All secured endpoints expect the `x-actor-id` header to identify the calling user. The backend services enforce strict authorization (e.g., verifying a judge can only accept their own invitation, and organizers are required for administrative tasks).

---

## 1. Judge Management

### Invite Judge
* **Endpoint:** `POST /api/judging/events/:eventId/judges/:judgeId/invite`
* **Response:** `{ "success": true, "data": { "id": "uuid" } }`

### Accept Invitation
* **Endpoint:** `POST /api/judging/events/:eventId/judges/:judgeId/accept`
* **Response:** `{ "success": true, "data": null }`

### Suspend Judge
* **Endpoint:** `POST /api/judging/events/:eventId/judges/:judgeId/suspend`
* **Response:** `{ "success": true, "data": null }`

### Reactivate Judge
* **Endpoint:** `POST /api/judging/events/:eventId/judges/:judgeId/reactivate`
* **Response:** `{ "success": true, "data": null }`

### Remove Judge
* **Endpoint:** `DELETE /api/judging/events/:eventId/judges/:judgeId`
* **Response:** `{ "success": true, "data": null }`

### Declare Conflict
* **Endpoint:** `POST /api/judging/projects/:projectId/judges/:judgeId/conflict`
* **Body:** `{ "reason": "DECLARED" }`
* **Response:** `{ "success": true, "data": { "id": "conflict_uuid" } }`

### Resolve Conflict
* **Endpoint:** `DELETE /api/judging/conflicts/:conflictId`
* **Response:** `{ "success": true, "data": null }`

### List Event Judges
* **Endpoint:** `GET /api/judging/events/:eventId/judges`
* **Response:** `{ "success": true, "data": [{ "id": "...", "status": "ACTIVE", "judge": {...} }] }`

---

## 2. Assignments

### Generate Assignments
* **Endpoint:** `POST /api/judging/events/:eventId/assignments/run`
* **Body:** `{ "kValue": 3, "forceNewRun": false }`
* **Response:** `{ "success": true, "data": { "id": "run_uuid" } }`

### Retrieve Assignment Run
* **Endpoint:** `GET /api/judging/assignments/runs/:runId`
* **Response:** `{ "success": true, "data": { "id": "...", "status": "COMPLETED", "snapshotHash": "..." } }`

### Retrieve Project Assignments
* **Endpoint:** `GET /api/judging/projects/:projectId/assignments`
* **Response:** `{ "success": true, "data": [...] }`

### Retrieve Judge Assignments
* **Endpoint:** `GET /api/judging/judges/:judgeId/assignments`
* **Response:** `{ "success": true, "data": [...] }`

### Retrieve Assignment Status
* **Endpoint:** `GET /api/judging/assignments/:assignmentId/status`
* **Response:** `{ "success": true, "data": { "state": "ACTIVE" } }`

### Retrieve Assignment Lineage
* **Endpoint:** `GET /api/judging/assignments/:assignmentId/lineage`
* **Response:** `{ "success": true, "data": { ..., "replacedAssignment": {...}, "replacement": {...} } }`

---

## 3. Rubrics

### Create Rubric
* **Endpoint:** `POST /api/judging/events/:eventId/rubrics`
* **Body:** `{ "name": "...", "description": "..." }`
* **Response:** `{ "success": true, "data": { "id": "rubric_uuid" } }`

### Create Rubric Version
* **Endpoint:** `POST /api/judging/rubrics/:rubricId/versions`
* **Response:** `{ "success": true, "data": { "id": "version_uuid" } }`

### Add Criterion
* **Endpoint:** `POST /api/judging/rubric-versions/:versionId/criteria`
* **Body:** `{ "name": "...", "weight": 20, "maxScore": 10, "displayOrder": 1, "isRequired": true }`
* **Response:** `{ "success": true, "data": { "id": "criterion_uuid" } }`

### Publish Rubric Version
* **Endpoint:** `POST /api/judging/rubric-versions/:versionId/publish`
* **Response:** `{ "success": true, "data": null }`

### Retrieve Published Rubric
* **Endpoint:** `GET /api/judging/rubrics/:rubricId/published`
* **Response:** `{ "success": true, "data": { "version": 1, "criteria": [...] } }`

---

## 4. Evaluations

### Start Evaluation
* **Endpoint:** `POST /api/judging/assignments/:assignmentId/evaluations/start`
* **Body:** `{ "rubricVersionId": "..." }`
* **Response:** `{ "success": true, "data": { "id": "evaluation_uuid" } }`

### Save Draft
* **Endpoint:** `POST /api/judging/evaluations/:evaluationId/draft`
* **Body:** `{ "scores": [{ "criterionId": "...", "score": 8 }] }`
* **Response:** `{ "success": true, "data": null }`

### Submit Evaluation
* **Endpoint:** `POST /api/judging/evaluations/:evaluationId/submit`
* **Body:** `{ "scores": [{ "criterionId": "...", "score": 8 }] }`
* **Response:** `{ "success": true, "data": null }`

### Reopen Evaluation
* **Endpoint:** `POST /api/judging/evaluations/:evaluationId/reopen`
* **Body:** `{ "reason": "..." }`
* **Response:** `{ "success": true, "data": null }`

### Retrieve Evaluation
* **Endpoint:** `GET /api/judging/evaluations/:evaluationId`
* **Response:** `{ "success": true, "data": { "status": "SUBMITTED", "scores": [...] } }`

### Retrieve Judge's Evaluations
* **Endpoint:** `GET /api/judging/judges/:judgeId/evaluations`
* **Response:** `{ "success": true, "data": [...] }`

---

## 5. Normalization

### Run Normalization
* **Endpoint:** `POST /api/judging/events/:eventId/normalize`
* **Response:** `{ "success": true, "data": null }`

### Retrieve Normalization Results
* **Endpoint:** `GET /api/judging/evaluations/:evaluationId/normalization`
* **Response:** `{ "success": true, "data": { "status": "NORMALIZED", "resultValue": 1.2 } }`

### Retrieve Project Aggregated Score
* **Endpoint:** `GET /api/judging/events/:eventId/aggregated-scores`
* **Response:** `{ "success": true, "data": [{ "projectId": "...", "score": 0.85 }] }`

---

## 6. Audit

### Retrieve Entity Audit Trail
* **Endpoint:** `GET /api/judging/audit/entity/:entityName/:entityId`
* **Response:** `{ "success": true, "data": [...] }`

### Retrieve Event Audit History
* **Endpoint:** `GET /api/judging/audit/events/:eventId`
* **Response:** `{ "success": true, "data": [...] }`

### Retrieve Actor History
* **Endpoint:** `GET /api/judging/audit/actors/:actorId`
* **Response:** `{ "success": true, "data": [...] }`

### Verify Snapshot Integrity
* **Endpoint:** `POST /api/judging/audit/verify-snapshot`
* **Body:** `{ "runId": "..." }`
* **Response:** `{ "success": true, "data": { "isValid": true, "expectedHash": "..." } }`

### Verify Audit Integrity
* **Endpoint:** `POST /api/judging/audit/verify-integrity`
* **Response:** `{ "success": true, "data": { "isValid": true, "errors": [] } }`
