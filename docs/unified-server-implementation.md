# Unified Server Implementation

## 1. Unified Architecture
A single backend HTTP server has been established on Port 5000 using Express. 
It seamlessly orchestrates the Member 1 MongoDB-backed domain alongside the Prisma-backed Judging domain within the same runtime process, without duplicating middleware or database lifecycles.

## 2. Files Changed
* `backend/server.ts` (Created as the unified entrypoint)
* `backend/backend-platform/backend/src/app.js` (Removed `.listen()`, now exports the `app`)
* `backend/package.json` (Added `dev` and `start` scripts pointing to `ts-node server.ts`)
* `frontend/frontend-platform/vite.config.ts` (Added API proxy for `/api` to target `http://localhost:5000`)

## 3. Route Mounting
* **Member 1 Routes**: Remain inherently mounted on the base Express `app` instance (`/api/auth`, `/api/events`, etc.).
* **Judging Routes**: Mounted explicitly in `server.ts` via `app.use('/api/judging', createJudgingRouter(prisma))`.
* **Collisions**: There are zero route path collisions.

## 4. Database Lifecycle
* **MongoDB**: Initialized strictly by the Member 1 app during module import (`connectDatabase()`). The unified server reuses this pool.
* **PostgreSQL**: Initialized explicitly in `server.ts` via `const prisma = new PrismaClient()` exactly once.
* **Duplication**: No duplicate clients or redundant connection attempts occur.

## 5. Port Configuration
The unified HTTP server listens on `process.env.PORT || 5000`. The previously detached Member 1 `.listen()` call has been removed.

## 6. Vite Proxy Configuration
The frontend's `vite.config.ts` has been updated to include a proxy rule mapping `/api` requests to `http://localhost:5000`. This allows the Vite development server on Port 3000 to transparently forward backend requests without frontend code changes or hardcoded URLs.

## 7. CORS Behavior
Because the Vite proxy handles the cross-origin boundary during development, requests from the browser appear to originate from the same origin as the frontend. Therefore, no restrictive or permissive (`*`) CORS middleware needed to be aggressively introduced to the unified server.

## 8. Validation Results
* TypeScript compilation passed.
* Test suites executed successfully.
* MongoDB connection remains isolated but active within the shared process.
* The frontend can reach all endpoints via `/api`.

## 9. Rollback Considerations
* `backend/src/api/app.ts` was preserved intact.
* To rollback, simply remove the proxy from Vite, delete `backend/server.ts`, and restore the `app.listen()` block at the bottom of `app.js`.

## 10. Remaining Integration Blocker
The structural unification is complete. The final blocker is the **Authentication translation bridge**. The frontend sends `jsonwebtoken` tokens from the Member 1 auth system, but the Judging engine expects an explicit `x-actor-id` header to authorize operations. A middleware must be implemented to verify the JWT and inject this header into the `/api/judging` request stream.
