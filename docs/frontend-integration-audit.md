# Frontend Integration Audit

## Current API Architecture

The frontend currently has **two parallel API layers** that are architecturally independent:

1. **Mock/Local Storage layer** (`src/api/*.ts` + `src/api/storage.ts`):
   - Used by `authApi`, `eventsApi`, `teamsApi`, `projectsApi`, `judgingApi`, etc.
   - All data is stored in `localStorage` under `devpulse_*` keys.
   - No HTTP requests are made.
   - **This is what the app currently uses for ALL pages.**

2. **Real HTTP API layer** (`src/services/api/*.ts` + `src/services/api/client.ts`):
   - Built against the judging engine API schema.
   - Feature-flagged behind `USE_MOCK_API` (defaults to `true` unless `VITE_USE_MOCK_API=false`).
   - Uses `apiClient` from `src/services/api/client.ts`.
   - Only called when `USE_MOCK_API === false`.
   - **This layer currently silently falls back to mock data at runtime.**

---

## Authentication

| Property | Current Behavior |
|---|---|
| JWT storage key | `devpulse_jwt_token` in `localStorage` |
| Token value (mock) | Fake string: `jwt_token_<userId>` — NOT a real JWT |
| Token injection | `src/services/api/client.ts` reads `devpulse_jwt_token` and sends `Authorization: Bearer <token>` |
| Login flow | `authApi.login()` in `src/api/auth.ts` — does NOT call the backend, uses `localStorage` only |
| Registration | `authApi.register()` — also local-only |
| Logout | Removes both `devpulse_current_user` and `devpulse_jwt_token` from localStorage |
| Token expiry | Not handled — no expiry refresh logic |
| x-actor-id | Not present anywhere in the frontend |

**Critical finding**: The current token `jwt_token_<userId>` is a fake string, NOT a real JWT. The backend's JWT bridge will reject it with `401 Unauthorized`. Login must be redirected to the real backend `POST /api/auth/login` endpoint to obtain a valid signed JWT.

---

## Existing API Client

**Primary real-API client**: `src/services/api/client.ts`

- Base URL: `(import.meta.env.VITE_API_BASE_URL) || '/api'` — already uses relative `/api`
- Token injection: Reads `devpulse_jwt_token` from localStorage, injects as `Authorization: Bearer <token>`
- Error handling: Translates HTTP status codes (401, 403, 409) to user-friendly messages
- **CORS**: Not a concern — Vite proxy already configured to forward `/api` to port 5000

**Secondary mock API layer**: `src/api/*.ts` — calls `storage.ts` (localStorage only), no HTTP.

---

## Backend URL References

| Frontend Location | Current API Target | Required Target | Change Needed |
|---|---|---|---|
| `src/api/auth.ts` | localStorage only | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` | Replace with real HTTP call |
| `src/api/events.ts` | localStorage only | `GET/POST/PATCH/DELETE /api/events` | Replace with real HTTP call |
| `src/api/teams.ts` | localStorage only | `GET/POST /api/teams` | Replace with real HTTP call |
| `src/api/projects.ts` | localStorage only | `GET/POST /api/projects` | Replace with real HTTP call |
| `src/api/judging.ts` | localStorage only | `GET/POST /api/judging/...` | Replace with real HTTP call |
| `src/services/api/judges.api.ts` | `/judges` (WRONG) | `/api/judging/events/:eventId/judges` | Fix path + disable mock |
| `src/services/api/assignments.api.ts` | `/assignments/runs` (WRONG) | `/api/judging/events/:eventId/assignments/run` | Fix path + disable mock |
| `src/services/api/evaluations.api.ts` | `/evaluations` (WRONG) | `/api/judging/assignments/:assignmentId/evaluations/start` | Fix path + disable mock |
| `src/services/api/rubrics.api.ts` | `/rubrics/event/:eventId` (WRONG) | `/api/judging/events/:eventId/rubrics` | Fix path + disable mock |
| `src/services/api/normalization.api.ts` | `/normalization/run` (WRONG) | `POST /api/judging/events/:eventId/normalize` | Fix path + disable mock |
| `src/services/api/audit.api.ts` | `/audit` (WRONG) | `/api/judging/audit/events/:eventId` | Fix path + disable mock |
| `src/services/api/conflicts.api.ts` | `/conflicts` (WRONG) | `/api/judging/projects/:projectId/judges/:judgeId/conflict` | Fix path + disable mock |

**No hardcoded `localhost` or port numbers found in frontend source.**

---

## Judging UI Inventory

The following judging pages EXIST in the frontend:

| Page | File | Current Data Source | API Calls Made |
|---|---|---|---|
| Judge Dashboard | `pages/judge/JudgeDashboard.tsx` | Mock data | `judgingApi.getAssignments()` → localStorage |
| Judge Evaluation | `pages/judge/JudgeEvaluationPage.tsx` | Mock data | `judgingApi.getEvaluation()`, `judgingApi.saveEvaluation()` → localStorage |
| Judge Workspace | `pages/judge/JudgeWorkspacePage.tsx` | Mock data | `judgingApi.*` → localStorage |
| Judge Events | `pages/judge/JudgeEventsPage.tsx` | Mock data | `eventsApi.getEvents()` → localStorage |
| Judge Submissions | `pages/judge/JudgeEventSubmissionsPage.tsx` | Mock data | `projectsApi.*`, `judgingApi.*` → localStorage |
| Assignment Dashboard | `pages/organizer/AssignmentDashboardPage.tsx` | Mock data | `assignmentsApi.*` (services layer, mock-guarded) |
| Judge Management | `pages/organizer/JudgeManagementPage.tsx` | Mock data | `judgesApi.*` (services layer, mock-guarded) |
| Rubric Management | `pages/organizer/RubricManagementPage.tsx` | Mock data | `rubricApi.*` (services layer, mock-guarded) |
| Normalization | `pages/organizer/NormalizationDashboardPage.tsx` | Mock data | `normalizationApi.*` (services layer, mock-guarded) |
| Audit Log | `pages/organizer/AuditLogPage.tsx` | Mock data | `auditApi.*` (services layer, mock-guarded) |
| Judge Conflicts | `pages/organizer/JudgeConflictManagementPage.tsx` | Mock data | `conflictsApi.*` (services layer, mock-guarded) |

---

## API Contract Compatibility

The `services/api/*.ts` layer was built anticipating a different API contract than what the backend actually exposes. Key mismatches:

| Area | Frontend Calls | Backend Route | Compatible? | Required Change |
|---|---|---|---|---|
| List judges | `GET /judges?eventId=` | `GET /api/judging/events/:eventId/judges` | ❌ | Fix path |
| Invite judge | `POST /judges/invite` | `POST /api/judging/events/:eventId/judges/:judgeId/invite` | ❌ | Fix path + fix params |
| Suspend judge | `POST /judges/:id/suspend` | `POST /api/judging/events/:eventId/judges/:judgeId/suspend` | ❌ | Fix path |
| Trigger assignments | `POST /assignments/runs` | `POST /api/judging/events/:eventId/assignments/run` | ❌ | Fix path + body |
| List assignments | `GET /assignments?eventId=` | `GET /api/judging/judges/:judgeId/assignments` | ❌ | Fix path |
| Get rubric | `GET /rubrics/event/:eventId` | `GET /api/judging/rubrics/:rubricId/published` | ❌ | Fix path |
| Create rubric | `POST /rubrics/event/:eventId/versions` | `POST /api/judging/events/:eventId/rubrics` | ❌ | Fix path |
| Start evaluation | `POST /evaluations` | `POST /api/judging/assignments/:assignmentId/evaluations/start` | ❌ | Fix path |
| Submit evaluation | `PUT /evaluations/:id` | `POST /api/judging/evaluations/:evaluationId/submit` | ❌ | Fix method + path |
| Run normalization | `POST /normalization/run` | `POST /api/judging/events/:eventId/normalize` | ❌ | Fix path |
| Get audit logs | `GET /audit?...` | `GET /api/judging/audit/events/:eventId` | ❌ | Fix path |
| Declare conflict | `POST /conflicts` | `POST /api/judging/projects/:projectId/judges/:judgeId/conflict` | ❌ | Fix path |

**All judging API paths in `services/api/` are wrong and need to be rewritten.**

---

## JWT Handling

- The `apiClient` in `src/services/api/client.ts` already sends `Authorization: Bearer <token>`. ✅
- It does NOT manually set `x-actor-id`. ✅
- **Critical**: The current `login()` flow stores a fake `jwt_token_<userId>` string, not a real JWT. The backend will reject it at the bridge middleware. This must be fixed first.
- The frontend must call `POST /api/auth/login` to receive a real JWT from the Member 1 backend.

---

## Vite Proxy

- `vite.config.ts` has been updated (Phase 7C.2) to proxy `/api → http://localhost:5000`. ✅
- No hardcoded `localhost` or direct port references found in the frontend source. ✅
- The `apiClient` base URL defaults to `/api`, which will be proxied correctly. ✅

---

## Required Changes

### A. Authentication (HIGH PRIORITY — BLOCKER)
The `src/api/auth.ts` `login()` and `register()` functions must call the real backend:
- `authApi.login()` → `POST /api/auth/login` → store the returned real JWT in `devpulse_jwt_token`
- `authApi.register()` → `POST /api/auth/register`
- `authApi.getCurrentUser()` → `GET /api/auth/me` (using existing JWT)

### B. API Path Correction (HIGH PRIORITY)
All 8 files in `src/services/api/*.ts` have incorrect API paths. Each must be rewritten to match the backend contract in `docs/judging-api-contract.md`.

### C. Environment Variable
Create `frontend/frontend-platform/.env.local`:
```
VITE_USE_MOCK_API=false
```
This disables the mock fallback and activates the real HTTP layer.

### D. Mock API Deactivation
The `src/api/*.ts` files (old localStorage mock layer) can remain as fallback but pages must be migrated to call `src/services/api/*.ts` instead.

### E. Response Shape Unwrapping
The backend returns `{ success: true, data: { ... } }`. The `apiClient` currently returns the full response object. Each `services/api/*.ts` function needs to unwrap `.data` from the response.

---

## Files To Modify

| File | Change Required |
|---|---|
| `src/api/auth.ts` | Replace mock logic with real HTTP calls |
| `src/services/api/client.ts` | Add `.data` unwrapping from `{ success, data }` wrapper |
| `src/services/api/judges.api.ts` | Fix all API paths |
| `src/services/api/assignments.api.ts` | Fix all API paths |
| `src/services/api/evaluations.api.ts` | Fix all API paths |
| `src/services/api/rubrics.api.ts` | Fix all API paths |
| `src/services/api/normalization.api.ts` | Fix all API paths |
| `src/services/api/audit.api.ts` | Fix all API paths |
| `src/services/api/conflicts.api.ts` | Fix all API paths |
| `.env.local` (create) | Set `VITE_USE_MOCK_API=false` |

---

## Files To Leave Untouched

| File | Reason |
|---|---|
| `src/api/storage.ts` | Useful for offline/dev fallback |
| `src/api/events.ts`, `teams.ts`, `projects.ts` | May be migrated later but not critical for judging |
| `src/pages/**/*.tsx` | No page-level changes needed — they already consume the service layer |
| `src/context/**` | Auth context can be updated after `authApi` is fixed |
| `src/types/**` | Existing types are structurally compatible |
| `src/mock/**` | Keep as dev fallback |
| `vite.config.ts` | Already correct |

---

## Risks

1. **Real login required**: Once `VITE_USE_MOCK_API=false`, all pages that depend on mock state will break until auth is wired to the backend.
2. **Response shape mismatch**: The backend returns `{ success: true, data: ... }`. If `apiClient` returns the raw response, all callers will receive `undefined` where they expect actual data.
3. **Sequential dependency**: Auth must work first (real JWT needed) before judging routes can be called.

---

## Implementation Order

1. Fix `src/services/api/client.ts` to unwrap `{ data }` from success responses.
2. Fix `src/api/auth.ts` — make `login()` and `register()` call real backend.
3. Create `.env.local` with `VITE_USE_MOCK_API=false`.
4. Fix all API paths in `src/services/api/*.ts` (judges, assignments, evaluations, rubrics, normalization, audit, conflicts).
5. Test each judging workflow end-to-end.
