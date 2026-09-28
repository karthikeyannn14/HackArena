# SQLite Migration Recovery Audit

**Audit Date:** September 28, 2026  
**Status:** READ-ONLY RECOVERY AUDIT  
**Objective:** Establish exact repository state, compiler configuration, database setup, and identify the first blocking errors without modifying implementation.

---

## A. Repository State

### 1. Git Availability
- No `.git` repository folder exists in the workspace (or `git` CLI is not installed in the Windows path).
- Repository tracking was assessed by inspecting file timestamps, file system hierarchy, and recent modifications.

### 2. File Inventories
- **Newly Generated / Added Files:**
  - `backend/prisma/dev.db` (SQLite database file, ~258 KB)
  - `backend/prisma/migrations/20260928074524_init_sqlite/migration.sql` (Initial SQLite migration)
  - `backend/prisma/migrations/migration_lock.toml`
  - `backend/prisma/seed.js` (SQLite demo seed script)
  - `backend/src/judging/domain/enums.ts` (Canonical runtime enum objects and types)
  - `backend/src/judging/utils/JsonField.ts`
  - `backend/server.ts` (Unified Express entrypoint mounting platform and judging routers)
- **Deleted Files:**
  - `backend/backend-platform/backend/src/config/database.js` (Former MongoDB connection module)
  - 6 Mongoose Model files under `backend/backend-platform/backend/src/modules/`:
    - `users/user.model.js`
    - `events/event.model.js`
    - `teams/team.model.js`
    - `teams/teamMember.model.js`
    - `projects/project.model.js`
    - `submissions/submission.model.js`
- **Modified Configuration / Manifests:**
  - `backend/package.json` (Includes `@prisma/client`, `prisma`, `express`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`)
  - `backend/package-lock.json`
  - `backend/tsconfig.json`
  - `backend/.env` (Configured to `DATABASE_URL="file:./dev.db"`)
  - `backend/backend-platform/backend/package.json` (Still lists `"mongoose": "^9.10.2"`, though unused by root)
  - `frontend/frontend-platform/.env.local` (`VITE_USE_MOCK_API=false`)

---

## B. Prisma State

- **Datasource Provider:** `sqlite`
- **Database URL:** `"file:./dev.db"`
- **Prisma CLI Version:** `5.22.0`
- **`@prisma/client` Version:** `5.22.0`
- **Client Generation:** **PASS** (`npx prisma generate` generated Prisma Client v5.22.0 in ~290ms)
- **Schema Validation:** **PASS** (`npx prisma validate` reports schema valid)
- **Migrations:** Active migration present at `prisma/migrations/20260928074524_init_sqlite`
- **Database File:** Present at `backend/prisma/dev.db` (~258,048 bytes)

---

## C. Backend State

- **Exact Entrypoint:** `backend/server.ts`
- **Startup Command:** `ts-node server.ts` (`npm run dev` or `npm start`)
- **Compilation Status:** Compiles and executes cleanly via `ts-node`.
- **Runtime Startup:** **PASS**. Successfully starts Express and listens on port 5000.
  - Mounts platform routes on `/api`
  - Mounts judging routes on `/api/judging` with `jwtActorBridge` middleware
- **Runtime Errors:** Zero startup runtime errors.

---

## D. TypeScript / Compiler Configuration State

Inspection of `backend/tsconfig.json`:
- `strict`: **`true`**
- `exactOptionalPropertyTypes`: **`false`**
- `verbatimModuleSyntax`: **`false`**
- `module`: **`"commonjs"`**
- `target`: **`"es2020"`**
- `noUncheckedIndexedAccess`: **`true`**
- `moduleResolution`: Default Node/CommonJS resolution

*Note:* Strict mode was re-enabled. No compiler settings are being weakened to hide errors.

---

## E. Judging-Code Modifications

1. **Automated Replacement Check:**
   - `string.ACTIVE`: **None found** (0 occurrences)
   - `string.PENDING`: **None found** (0 occurrences)
   - `string.COMPLETED`: **None found** (0 occurrences)
   - `string.FAILED`: **None found** (0 occurrences)
2. **Usage of `any`:**
   - Restricted to `src/judging/normalization/types.ts` (`metadata?: any`) and `src/judging/assignment/SnapshotIntegrity.ts` (`snapshotPayload: any`).
3. **Enum Type Handling:**
   - SQLite does not support native ENUM types. In `schema.prisma`, enum columns were converted to `String`.
   - To preserve semantic type safety without relying on deleted `@prisma/client` enum exports, runtime enum dictionaries and types were placed in `src/judging/domain/enums.ts` (`AssignmentRunStatus`, `AssignmentState`, `EvaluationStatus`, `EventJudgeStatus`, `ConflictReason`) and `src/judging/normalization/types.ts` (`NormalizationStatus`).
4. **Judging Algorithms:**
   - Normalization formulas and thresholds in `ZScoreNormalizationStrategy.ts` and `ProjectAggregator.ts` remain intact.
   - Assignment flow in `MinCostAssignmentStrategy.ts` remains intact.

---

## F. MongoDB & PostgreSQL Removal State

- **Mongoose Models:** All 6 deleted from `src/modules`.
- **`database.js`:** Deleted.
- **`shadow-sync.service.js`:** File physically exists on disk in `modules/sync/`, but is **completely disconnected** from runtime execution (no imports or calls in any active module).
- **Mongoose Imports:** No active controller, service, or middleware imports `mongoose`.
- **Mongoose Package:** Still referenced in subfolder `backend/backend-platform/backend/package.json`, but absent from root `backend/package.json`.
- **PostgreSQL Connection:** Prisma datasource provider is `sqlite`. No PostgreSQL client or connection string exists in runtime.

---

## G. Platform Persistence State

The Member 1 platform services have been migrated from Mongoose to Prisma:
- **Authentication:** `auth.service.js` queries `prisma.user.findUnique` and `prisma.user.create`.
- **Events:** `event.service.js` queries `prisma.event`.
- **Teams:** `team.service.js` queries `prisma.team` and `prisma.teamMember`.
- **Team Members:** Direct Prisma operations on `prisma.teamMember`.
- **Projects:** `project.service.js` queries `prisma.project`.
- **Submissions:** `submission.service.js` queries `prisma.submission`.

Both platform and judging engines share the same unified Prisma models in SQLite.

---

## H. Frontend State

- **`VITE_USE_MOCK_API`:** Set to `false` in `frontend/frontend-platform/.env.local`.
- **API Base URL:** Configured to `/api` (relative endpoint for reverse proxy or direct unified server routing).
- **Login Endpoint:** `POST /api/auth/login` (stores real JWT in `devpulse_jwt_token`).
- **Judging Endpoints:** Connected to `/judging/*` (mounted on `/api/judging/*`).
- **Frontend Production Build:** **PASS** (`npm run build` completed cleanly in 939ms).

---

## I. Validation Commands Actually Executed

1. `npx prisma validate`: **PASS** (Exit Code 0)
2. `npx prisma generate`: **PASS** (Exit Code 0)
3. `npx tsc --noEmit`: **FAIL** (Exit Code 1, stopped validation chain)
4. `npx jest tests/jwt-actor-bridge.test.ts`: **PASS** (5/5 tests passed)

---

## J. First Blocking Error

From `npx tsc --noEmit`:
```text
src/judging/assignment/MinCostAssignmentStrategy.ts(177,42): error TS2532: Object is possibly 'undefined'.
```
**Location:** Lines 177-178 of `MinCostAssignmentStrategy.ts`:
```ts
for (let i = 0; i < M; i++) {
  const judgeNode = 2 + i;
  for (let j = 0; j < N; j++) {
    const projectNode = 2 + M + j;
    if (!conflictChecker.hasConflict(judges[i].judgeId, projects[j].projectId)) { ... }
```
Under `"strict": true` combined with `"noUncheckedIndexedAccess": true`, TypeScript flags `judges[i]` and `projects[j]` as possibly undefined because array indexing with bounds checking is strict.

---

## K. Changes That Appear Unsafe or Overly Broad

1. **Legacy Mongoose Model Unit Tests:**
   - 6 files under `backend/backend-platform/backend/src/modules/*/*.model.test.js` still attempt to require deleted `.model.js` files when Jest is run without a scoped `testMatch`.
2. **Prisma Enum Imports in Integration Tests:**
   - Several integration test files (`audit-lineage.service.integration.test.ts`, `judge.service.integration.test.ts`, `normalization.service.integration.test.ts`) still contain legacy imports like `import { EventJudgeStatus, ConflictReason } from '@prisma/client'`, which were removed when Prisma converted enums to SQLite strings.
3. **JSON Object vs String in Test Fixtures:**
   - Several test files pass raw objects `{}` to `snapshotPayload` instead of `JSON.stringify({})`.
4. **Dangling File:**
   - `backend/backend-platform/backend/src/modules/sync/shadow-sync.service.js` remains on disk despite being obsolete.

---

## L. Recommended Recovery Order

1. **Step 1: Code-level Null Checks (Do Not Weaken TSConfig)**
   - Add guarded variable assignments for `judges[i]` and `projects[j]` in `MinCostAssignmentStrategy.ts` to satisfy `strict` and `noUncheckedIndexedAccess`.
2. **Step 2: Update Test Imports to Canonical Enums**
   - Point remaining integration tests to `src/judging/domain/enums.ts` instead of `@prisma/client`.
   - Stringify `snapshotPayload` in test seed calls.
3. **Step 3: Verify TypeScript Compilation**
   - Run `npx tsc --noEmit` and confirm 0 errors with strict mode enabled.
4. **Step 4: Clean Up Test Scoping & Obsolete Files**
   - Ensure Jest `testMatch` excludes obsolete Mongoose unit test files.
   - Archive or remove disconnected `shadow-sync.service.js`.
5. **Step 5: Full Integration & API Suite Execution**
   - Run backend test suite.
   - Run live HTTP endpoint verification.
