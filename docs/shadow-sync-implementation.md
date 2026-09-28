# Shadow Sync Implementation

## 1. Files Changed
* `backend/backend-platform/backend/src/modules/sync/shadow-sync.service.js` (Created)
* `backend/backend-platform/backend/src/modules/events/event.controller.js`
* `backend/backend-platform/backend/src/modules/teams/team.controller.js`
* `backend/backend-platform/backend/src/modules/projects/project.controller.js`

## 2. Synchronization Flow
The integration introduces a lightweight, one-way shadow sync module. 
When a MongoDB creation operation succeeds in the Member 1 Backend (`createEvent`, `createTeam`, `createProject`), the controller immediately invokes a corresponding sync function from `shadow-sync.service.js`. This service uses its own instance of `PrismaClient` to instantly mirror the minimum required fields into PostgreSQL.

## 3. Exact Fields Copied
Only the bare minimum fields required by the Judging algorithms and Prisma `@relation` constraints are copied:
* **Event**: `id` (`Mongo _id.toString()`), `name`
* **Team**: `id` (`Mongo _id.toString()`), `name`
* **Project**: `id` (`Mongo _id.toString()`), `name`, `eventId` (`toString()`), `teamId` (`toString()`)

## 4. Idempotency Strategy
The sync module leverages Prisma's `upsert` mechanism on the unique `id` field.
If the sync function is called multiple times for the same MongoDB entity (e.g., a retry mechanism or manual trigger), Prisma will update the `name` (and references) rather than throwing a duplicate key error or creating parallel shadow records.

## 5. Failure Behavior
PostgreSQL synchronization errors do NOT rollback the MongoDB transaction. 
Errors in the shadow sync process are explicitly caught and logged (`console.error("Shadow sync error:", error);`). The HTTP request to the frontend will still succeed with `201 Created` because MongoDB remains the authoritative source of truth. If a sync fails, the data will be in an "orphaned state" where Judging operations on that specific entity will fail until the sync is manually retried or resolved.

## 6. Dependency Handling
The `Project` shadow record strictly depends on its `Event` and `Team` shadow records existing first.
Because the synchronization is hooked at the endpoint layer directly after successful creation—and MongoDB logically guarantees the Event and Team must exist before the Project can be created—the Postgres shadow records will inherently be created in the correct topological order (Event -> Team -> Project). Prisma's `upsert` guarantees that foreign key constraints are met.

## 7. Validation Performed
* Added the sync calls to the Member 1 controllers strictly *after* successful MongoDB transactions.
* Created the independent Prisma Client inside the JS module.
* Mapped `ObjectId` explicitly to `String` using `.toString()` before passing to Prisma to prevent type coercion errors.
* Executed the existing build/typecheck commands to ensure no structural breakages occurred in either framework.

## 8. Remaining Integration Blockers
The databases are now safely bridged for new entities. The final missing pieces are:
1. Creating the unified Express server wrapper to mount both apps onto Port 5000.
2. Building the Authentication middleware bridge to translate Member 1 JWTs into Judging Backend `x-actor-id` headers.
