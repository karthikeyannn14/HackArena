# Platform Integration Plan

This plan details the safe, phased approach to integrating the Member 1 Backend (MongoDB/JS) and the Judging Backend (PostgreSQL/TS) to serve the unified React/Vite Frontend.

## Phase A — API Boundary (Unified Server Wrapper)
**Objective**: Expose both the MongoDB-backed routes and PostgreSQL-backed routes through a single Express server on port `5000`.

* **Files to modify**: 
  - `backend/backend-platform/backend/src/app.js` (Export the app instead of listening directly)
  - `backend/src/api/app.ts` (Import the Member 1 app as a sub-router/middleware)
  - Create `backend/server.ts` as the unified entry point.
* **Dependencies**: `ts-node` to run the mixed JS/TS project, or standard transpilation.
* **Expected Behavior**: Both `/api/auth` and `/api/judging` are reachable on `localhost:5000`.
* **Tests required**: Verify `curl http://localhost:5000/api/health` and `curl http://localhost:5000/api/judging/...`
* **Risks**: CommonJS and ES Module interop issues between Member 1 JS files and Judging TS files.

## Phase B — Authentication Bridge
**Objective**: Allow the Judging Backend to identify the user making requests without rebuilding auth.

* **Files to modify**: 
  - `backend/src/api/judging.routes.ts`
* **Expected Behavior**: A middleware intercepts requests to `/api/judging`, decodes the Bearer JWT created by Member 1 (`jsonwebtoken`), extracts `userId`, and assigns it to `req.headers['x-actor-id']` or explicitly calls `getActorId`.
* **Tests required**: Submit an evaluation with a valid JWT and verify the actor ID is recorded in the Audit Log correctly.
* **Risks**: Secret key (`process.env.JWT_SECRET`) must be shared/accessible to the Judging router.

## Phase C — Entity ID Bridge
**Objective**: Allow Prisma to safely store MongoDB `ObjectId` strings.

* **Files to modify**: 
  - `backend/prisma/schema.prisma` (if strict UUIDs were enforced, they must be changed to `String` to tolerate Mongo IDs).
* **Expected Behavior**: The Judging engine treats `eventId`, `projectId`, and `judgeId` (User IDs) as opaque string identifiers that map back to MongoDB records.
* **Tests required**: Verify `AssignmentService.generateAssignments` accepts a 24-character Mongo hex string for `eventId`.
* **Risks**: Loss of strict referential integrity for Users/Projects/Events within Postgres, as the true records live in Mongo.

## Phase D — Unified Backend Startup
**Objective**: Provide a single command to start the entire backend.

* **Files to modify**: 
  - `backend/package.json` (Merge essential dependencies from Member 1, add start scripts).
* **Expected Behavior**: `npm run dev` in the root `backend/` starts the unified server connecting to both Mongo and Postgres.
* **Tests required**: Application boot successfully connects to both databases.
* **Risks**: Dependency version conflicts (e.g., `express` versions).

## Phase E — Frontend API Migration
**Objective**: Point the frontend entirely at `localhost:5000` and ensure API payloads match.

* **Files to modify**: 
  - `frontend/frontend-platform/src/services/api/client.ts`
  - `.env` in the frontend (set `VITE_API_URL=http://localhost:5000`)
* **Expected Behavior**: The frontend seamlessly queries Auth/Events (Mongo) and Judging (Postgres).
* **Tests required**: Manual UI testing of login, event creation, and judging workflows.
* **Risks**: Frontend might expect structural differences in responses (e.g. `data.message` vs `error.message`).

## Phase F — End-to-End Testing
**Objective**: Validate the entire pipeline.

* **Files to modify**: Create generic E2E tests using Cypress/Playwright or robust integration tests.
* **Expected Behavior**: An organizer can create an event (Mongo), invite a judge (Postgres), a participant can submit a project (Mongo), and the judge can evaluate it (Postgres).
* **Tests required**: Full happy-path hackathon lifecycle test.
* **Risks**: Network/DB timeout issues in CI environments.
