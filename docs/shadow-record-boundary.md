# Shadow Record Boundary

This document outlines the minimal data synchronization boundary required to allow the Judging Engine (PostgreSQL/Prisma) to interact with domains owned by Member 1 (MongoDB/Mongoose), without migrating the databases.

## 1. Source-of-Truth Ownership
* **MongoDB (Member 1)**: Absolute source of truth for Users, Events, Teams, Projects, and Submissions.
* **PostgreSQL (Judging Engine)**: Source of truth for Judges, Assignments, Rubrics, Evaluations, Normalization, and Audit. Maintains "shadow records" of Mongo entities strictly to satisfy Foreign Key (`@relation`) constraints and assignment algorithms.

## 2. Required Shadow Models
The Judging Engine explicitly requires the following entities to exist in PostgreSQL:
* **Event**: Required for `EventJudge`, `Project`, `AssignmentRun`, and `Rubric` references.
* **Team**: Required because `Project` mandates a `teamId` relation, and the Assignment algorithm checks `teamId` to prevent Judges from reviewing their own team's project.
* **Project**: Required for `Assignment` and `JudgeConflict` references, and heavily read during `generateAssignments()`.

## 3. Minimum Fields
Only the fields required by the Prisma schema (due to `@default` absence or `@relation`) and judging algorithms must be synced:
* **Event**: `id` (Mongo `_id`), `name`.
* **Team**: `id` (Mongo `_id`), `name`.
* **Project**: `id` (Mongo `_id`), `name`, `eventId`, `teamId`.

*Note: Any other fields (e.g. descriptions, timestamps, metadata) are ignored by the judging engine and do not need to be synchronized.*

## 4. Required Relations
The following Prisma relational constraints enforce the shadow record dependency:
* `Project` cannot be created in Postgres unless the corresponding `Event` and `Team` already exist.
* `Judge` creation requires the `userId` (Mongo ID), but since there is no `User` model in Prisma, this is merely an ID reference—no shadow `User` record is needed.
* `Submission` is entirely disconnected from the Judging logic. No shadow `Submission` records are needed.

## 5. Synchronization Triggers
To maintain referential integrity without dropping `@relation` constraints, a lightweight, one-way sync from Mongo to Postgres must occur on the following triggers:
1. **Event Created**: Insert shadow `Event`.
2. **Team Created**: Insert shadow `Team`.
3. **Project Created**: Insert shadow `Project`.

## 6. What Must NOT Be Synchronized
* **Users**: There is no Prisma `User` model. `Judge.userId` safely stores the Mongo string.
* **Submissions**: The judging engine assigns projects, not submissions. `Submission` data is never queried.
* **Updates/Deletes**: If an Event/Project name changes, syncing is technically unnecessary because judging only relies on the ID structure. Deletions are complex and generally discouraged (soft-delete preferred) to prevent orphaned audit logs.

## 7. Data Consistency Risks
* **Race Conditions**: If a user creates a Project in Mongo and immediately triggers an assignment run before the Postgres shadow record is created, the Prisma query will fail or miss the project.
* **Orphaned State**: If the sync mechanism fails, Mongo will have a Project but Postgres will reject any judge assignments to it due to Foreign Key violations.

## 8. Recommended Implementation Order
1. Implement a unified backend event emitter or direct service bridge that hooks into Member 1's `createEvent`, `createTeam`, and `createProject` workflows.
2. In those hooks, call `prisma.event.create()`, `prisma.team.create()`, and `prisma.project.create()` to construct the minimal shadow records.
3. Remove or ignore the unused `Submission` model in Prisma in future phases to reduce confusion, as it serves no purpose to the judging engine.
