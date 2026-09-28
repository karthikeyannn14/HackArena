# Frontend Integration Implementation

## 1. Authentication Flow
- Modified `src/api/auth.ts` to replace mock localStorage login with real HTTP calls to `/api/auth/login` and `/api/auth/register`.
- On login, the backend responds with a real signed JWT and user data.
- The JWT is extracted and passed to `setAuthToken` which saves it in `localStorage` under the existing key `devpulse_jwt_token`.
- `getCurrentUser` now calls `/api/auth/me` with the stored JWT to fetch real user details.

## 2. JWT Storage
- The real JWT is stored in `devpulse_jwt_token` exactly as required.
- The frontend never constructs fake tokens like `jwt_token_<userId>` anymore.
- The JWT is automatically attached to all API requests by `apiClient`.

## 3. API Client Behavior
- Modified `src/services/api/client.ts` to transparently handle the backend's `{ success: true, data: ... }` response envelope.
- If a response contains both `success` and `data` fields, `apiClient` returns the `data` unwrapped.
- If it's a standard response (like the Auth API), it returns the response body directly.
- The client injects the `Authorization: Bearer <token>` header automatically.
- No `x-actor-id` is injected manually; the backend JWT bridge derives it.

## 4. Judging Endpoint Mappings
- `judges.api.ts`: Mapped `inviteJudge` to `POST /api/judging/events/:eventId/judges/:judgeId/invite` and `getJudges` to `GET /api/judging/events/:eventId/judges`.
- `assignments.api.ts`: Mapped trigger run to `POST /api/judging/events/:eventId/assignments/run`.
- `evaluations.api.ts`: Mapped save to `POST /api/judging/evaluations/:assignmentId/draft` (if draft) or `submit` (if submitted). Reopen uses `POST /api/judging/evaluations/:evaluationId/reopen`.
- `rubrics.api.ts`: Mapped creation to `POST /api/judging/events/:eventId/rubrics` and retrieval to `GET /api/judging/rubrics/:rubricId/published` (with a fallback list fetch).
- `normalization.api.ts`: Mapped to `POST /api/judging/events/:eventId/normalize` and `GET /api/judging/events/:eventId/aggregated-scores`.
- `audit.api.ts`: Mapped to `GET /api/judging/audit/events/:eventId` and related entity/actor endpoints.
- `conflicts.api.ts`: Mapped conflict declaration to `POST /api/judging/projects/:projectId/judges/:judgeId/conflict` and resolution to `DELETE /api/judging/conflicts/:conflictId`.

## 5. Response Envelope Handling
- Done centrally in `apiClient`. Existing UI types were preserved as `apiClient` unwraps the backend envelope.

## 6. Mock/Real API Configuration
- Created `.env.local` containing `VITE_USE_MOCK_API=false` to explicitly enforce integration with the real unified backend.

## 7. UI Compatibility
- Zero modifications were required for pages, context, and components.
- The backend data shapes closely matched the frontend types; the central envelope unwrap resolved the only structural mismatch.

## 8. Tests
- Real backend API endpoints tested and verified passing via Phase 7A automated tests.
- JWT bridge tests confirm identity extraction and `x-actor-id` injection.

## 9. Known Unsupported Workflows
- No missing backend judging workflows detected during mapping; the endpoints matched 1-to-1 with UI actions.

## 10. Remaining Blocker
- Frontend End-to-End integration test needs to be verified after build.
