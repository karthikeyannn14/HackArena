# SQLite Migration Feasibility Audit

## Current Architecture
- **Databases:** MongoDB (Mongoose) as the source of truth for platform entities + PostgreSQL (Prisma) as the judging engine shadow database.
- **Dependencies:** Requires locally running `mongod` and `postgres` daemon processes.

## Target Architecture
- **Database:** A single embedded SQLite database (`.db` file) managed via Prisma.
- **Dependencies:** None. Operates entirely within the Node.js process, satisfying the hackathon's "clean-machine" offline launch requirement.

## Model Inventories

### MongoDB (Mongoose) Models (6)
1. `User` (name, email, password, role)
2. `Event` (name, description, dates, status, organizer)
3. `Team` (name, event, owner)
4. `TeamMember` (team, user, role)
5. `Project` (name, description, event, team, status)
6. `Submission` (project, team, event, title, description, URLs, status, submittedAt)

### Prisma Models (17)
- `Event`, `Track`, `Team`, `Project`, `Submission` (Currently act as minimal shadow records or extensions)
- `Judge`, `EventJudge`, `JudgeConflict`, `AssignmentRun`, `Assignment`
- `Rubric`, `RubricVersion`, `Criterion`
- `Evaluation`, `CriterionScore`, `NormalizationResult`
- `AuditLog`

## Entity Mapping & Mismatches
To unify the schemas, the Prisma models must absorb the MongoDB fields:
- **User:** New Prisma model required.
- **Event/Team/Project/Submission:** Existing Prisma shadow models must be expanded to include all MongoDB fields (e.g., `description`, `status`, `repositoryUrl`, etc.).
- **TeamMember:** New Prisma model required to handle the many-to-many relationship with roles.
- **IDs:** MongoDB `ObjectId` (24-char hex strings) can be safely stored in Prisma `String` fields. No ID rewriting is necessary.

## Prisma/SQLite Incompatibilities (CRITICAL)
1. **Enums:** SQLite does not support Enums. All Prisma `enum` definitions (e.g., `EventJudgeStatus`, `ConflictReason`, `AssignmentRunStatus`) must be converted to `String`.
2. **JSON Fields:** SQLite does not support the `Json` data type. Fields like `AssignmentRun.snapshotPayload` and `AuditLog.metadata` must be converted to `String`, requiring `JSON.stringify()` on write and `JSON.parse()` on read at the application level.

## API Contract Preservation
- The external request/response shapes for Member 1 APIs and Judging APIs can remain identical.
- Frontend components will require zero modifications.

## Authentication Migration
- `bcryptjs` and `jsonwebtoken` are fully compatible with SQLite.
- The auth service will simply swap Mongoose queries (`User.findOne`) for Prisma queries (`prisma.user.findUnique`). 
- Passwords remain hashed, and JWTs remain securely signed.

## Shadow-Sync Replacement
- The current Mongo-to-Postgres shadow synchronization logic can be deleted entirely.
- Both the Member 1 APIs and the Judging APIs will directly read/write the canonical Prisma `Event`, `Team`, and `Project` records.

## Recommended Migration Sequence
1. **Phase A:** Update `schema.prisma` for SQLite compatibility (convert enums/Json to strings, merge Mongo fields).
2. **Phase B:** Migrate the Auth service from Mongoose to Prisma.
3. **Phase C:** Migrate Member 1 entity services (Event, Team, Project, Submission) to Prisma.
4. **Phase D:** Strip out Mongoose, Mongo connection logic, and shadow-sync logic.
5. **Phase E:** Update Judging services to handle parsed JSON strings where `Json` types were previously used.
6. **Phase F:** Generate SQLite database and run full-stack tests.

## Data Migration
- Existing development mock data in MongoDB can be exported to a JSON file and loaded via a Prisma seed script (`prisma/seed.ts`).

## Risk Assessment
- **High Risk:** The conversion of Prisma `Json` fields to `String` for SQLite. The Judging engine heavily relies on `snapshotPayload`. Application logic must be carefully updated to parse/stringify these payloads without breaking type contracts.
- **Medium Risk:** Removing Mongoose `populate()`. Prisma uses `include: {}`. Deeply nested document queries must be rewritten carefully to preserve API response structures.

## Scope & Files
**Files requiring changes:**
- `prisma/schema.prisma`
- `backend-platform/backend/src/modules/**/*.service.js` (Rewriting Mongoose to Prisma)
- `backend-platform/backend/src/modules/**/*.model.js` (To be deleted)
- `src/judging/assignment/AssignmentSnapshotBuilder.ts` (JSON parsing/stringifying)
- `src/judging/audit/AuditLogger.ts` (JSON parsing/stringifying)

**Files to preserve (untouched):**
- Entire `frontend/` directory.
- JWT verification middleware.
- API Route definitions (`*.routes.js`, `judging.routes.ts`).

## Overall Feasibility
**PASS / RECOMMENDED.** 
The migration is technically straightforward. Removing the dual-database architecture eliminates massive deployment complexity and achieves the perfect "clean-machine" offline hackathon target.
