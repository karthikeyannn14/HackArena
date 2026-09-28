# Frontend Integration Contract

This document provides a comprehensive mapping of all backend APIs that the frontend consumes, identifying the unified response structures and the source service for each.

## Unified Response Format
All endpoints return standard JSON structures.

**Success Shape:**
```json
{
  "success": true,
  "data": { ... } // Varies by endpoint
}
```

**Error Shape:**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST | UNAUTHORIZED | NOT_FOUND | SERVER_ERROR | CONFLICT",
    "message": "Human readable string"
  }
}
```
*(Note: Member 1 Backend currently returns `message` directly at the root for errors, but will be standardized to match this layout during integration.)*

---

## AUTH
**Source Service:** Member 1 Backend (MongoDB)

### Register User
* **METHOD:** `POST`
* **PATH:** `/api/auth/register`
* **AUTH REQUIRED:** No
* **REQUEST:** `{ "name": "...", "email": "...", "password": "..." }`
* **SUCCESS RESPONSE:** `{ "success": true, "data": { "id": "...", "name": "...", "email": "...", "role": "PARTICIPANT" } }`
* **ERROR RESPONSE:** `400 Bad Request`, `409 Conflict` (Email exists)

### Login User
* **METHOD:** `POST`
* **PATH:** `/api/auth/login`
* **AUTH REQUIRED:** No
* **REQUEST:** `{ "email": "...", "password": "..." }`
* **SUCCESS RESPONSE:** `{ "success": true, "data": { "token": "...", "user": { ... } } }`
* **ERROR RESPONSE:** `400 Bad Request`, `401 Unauthorized` (Invalid credentials)

### Get Current User
* **METHOD:** `GET`
* **PATH:** `/api/auth/me`
* **AUTH REQUIRED:** Yes (Bearer Token)
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": { "user": { ... } } }`
* **ERROR RESPONSE:** `401 Unauthorized`

---

## EVENTS
**Source Service:** Member 1 Backend (MongoDB)

### List Events
* **METHOD:** `GET`
* **PATH:** `/api/events`
* **AUTH REQUIRED:** No
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": [{...}] }`
* **ERROR RESPONSE:** `500 Server Error`

### Get Event
* **METHOD:** `GET`
* **PATH:** `/api/events/:id`
* **AUTH REQUIRED:** No
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": {...} }`
* **ERROR RESPONSE:** `404 Not Found`

### Create Event
* **METHOD:** `POST`
* **PATH:** `/api/events`
* **AUTH REQUIRED:** Yes (ORGANIZER/ADMIN)
* **REQUEST:** `{ "name": "...", "description": "...", "startDate": "...", "endDate": "...", ... }`
* **SUCCESS RESPONSE:** `{ "success": true, "data": {...} }`
* **ERROR RESPONSE:** `400 Bad Request`, `401 Unauthorized`

---

## PROJECTS
**Source Service:** Member 1 Backend (MongoDB)

### Create Project
* **METHOD:** `POST`
* **PATH:** `/api/projects`
* **AUTH REQUIRED:** Yes (PARTICIPANT)
* **REQUEST:** `{ "name": "...", "description": "...", "eventId": "...", "teamId": "..." }`
* **SUCCESS RESPONSE:** `{ "success": true, "data": {...} }`
* **ERROR RESPONSE:** `400 Bad Request`, `401 Unauthorized`

### Get Project by Team
* **METHOD:** `GET`
* **PATH:** `/api/projects/team/:teamId`
* **AUTH REQUIRED:** No
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": {...} }`
* **ERROR RESPONSE:** `404 Not Found`

---

## JUDGES
**Source Service:** Judging Backend (PostgreSQL)

### Invite Judge
* **METHOD:** `POST`
* **PATH:** `/api/judging/events/:eventId/judges/:judgeId/invite`
* **AUTH REQUIRED:** Yes (ORGANIZER - via Token bridged to `x-actor-id`)
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": { "id": "..." } }`
* **ERROR RESPONSE:** `400 Bad Request`, `401 Unauthorized`

### Accept Invitation
* **METHOD:** `POST`
* **PATH:** `/api/judging/events/:eventId/judges/:judgeId/accept`
* **AUTH REQUIRED:** Yes (JUDGE)
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": null }`
* **ERROR RESPONSE:** `401 Unauthorized`, `404 Not Found`

### List Event Judges
* **METHOD:** `GET`
* **PATH:** `/api/judging/events/:eventId/judges`
* **AUTH REQUIRED:** Yes
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": [...] }`
* **ERROR RESPONSE:** `500 Server Error`

---

## ASSIGNMENTS
**Source Service:** Judging Backend (PostgreSQL)

### Generate Assignments
* **METHOD:** `POST`
* **PATH:** `/api/judging/events/:eventId/assignments/run`
* **AUTH REQUIRED:** Yes (ORGANIZER)
* **REQUEST:** `{ "kValue": 3, "forceNewRun": false }`
* **SUCCESS RESPONSE:** `{ "success": true, "data": { "id": "..." } }`
* **ERROR RESPONSE:** `400 Bad Request`

### Get Judge Assignments
* **METHOD:** `GET`
* **PATH:** `/api/judging/judges/:judgeId/assignments`
* **AUTH REQUIRED:** Yes (JUDGE)
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": [...] }`
* **ERROR RESPONSE:** `401 Unauthorized`

---

## RUBRICS
**Source Service:** Judging Backend (PostgreSQL)

### Create Rubric
* **METHOD:** `POST`
* **PATH:** `/api/judging/events/:eventId/rubrics`
* **AUTH REQUIRED:** Yes (ORGANIZER)
* **REQUEST:** `{ "name": "...", "description": "..." }`
* **SUCCESS RESPONSE:** `{ "success": true, "data": { "id": "..." } }`
* **ERROR RESPONSE:** `400 Bad Request`

### Get Published Rubric
* **METHOD:** `GET`
* **PATH:** `/api/judging/rubrics/:rubricId/published`
* **AUTH REQUIRED:** Yes
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": { ... } }`
* **ERROR RESPONSE:** `404 Not Found`

---

## EVALUATIONS
**Source Service:** Judging Backend (PostgreSQL)

### Start Evaluation
* **METHOD:** `POST`
* **PATH:** `/api/judging/assignments/:assignmentId/evaluations/start`
* **AUTH REQUIRED:** Yes (JUDGE)
* **REQUEST:** `{ "rubricVersionId": "..." }`
* **SUCCESS RESPONSE:** `{ "success": true, "data": { "id": "..." } }`
* **ERROR RESPONSE:** `400 Bad Request`

### Submit Evaluation
* **METHOD:** `POST`
* **PATH:** `/api/judging/evaluations/:evaluationId/submit`
* **AUTH REQUIRED:** Yes (JUDGE)
* **REQUEST:** `{ "scores": [...] }`
* **SUCCESS RESPONSE:** `{ "success": true, "data": null }`
* **ERROR RESPONSE:** `400 Bad Request`

---

## NORMALIZATION
**Source Service:** Judging Backend (PostgreSQL)

### Run Normalization
* **METHOD:** `POST`
* **PATH:** `/api/judging/events/:eventId/normalize`
* **AUTH REQUIRED:** Yes (ORGANIZER)
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": null }`
* **ERROR RESPONSE:** `400 Bad Request`

---

## AUDIT
**Source Service:** Judging Backend (PostgreSQL)

### Retrieve Event Audit History
* **METHOD:** `GET`
* **PATH:** `/api/judging/audit/events/:eventId`
* **AUTH REQUIRED:** Yes (ORGANIZER)
* **REQUEST:** None
* **SUCCESS RESPONSE:** `{ "success": true, "data": [...] }`
* **ERROR RESPONSE:** `400 Bad Request`
