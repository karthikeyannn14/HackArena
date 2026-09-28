# Unified Server Topology

## Current Architecture
The current ecosystem consists of two separate backend applications (Member 1 in JS, Judging in TS) and a React frontend. The backends manage separate domains but share no port, causing disconnected network boundaries.

## Member 1 Backend
* **Entrypoint**: `backend/backend-platform/backend/src/app.js`
* **Port**: 5000 (via `process.env.PORT || 5000`)
* **Database**: MongoDB (initialized via `connectDatabase()` inside `app.js`)
* **Routes**: `/api/auth`, `/api/events`, `/api/teams`, `/api/projects`, `/api/submissions`, `/api/health`
* **Middleware**: `express.json()`, `swaggerUi`
* **Listen behavior**: Directly calls `app.listen(PORT)` upon module execution.

## Judging Backend
* **Entrypoint**: `backend/src/api/app.ts`
* **Port**: N/A (Does not listen)
* **Database**: PostgreSQL (initialized implicitly via `const prisma = new PrismaClient()` on import)
* **Routes**: `/api/judging` (delegated to `judging.routes.ts`)
* **Middleware**: `express.json()`
* **Listen behavior**: Exports `{ app, prisma }`. Does not bind a server port.

## Frontend
* **API base URL**: Inherited from `VITE_API_BASE_URL` env var, defaults to `/api`.
* **Required routes**: Calls all routes from Member 1 and Judging prefixed with `/api`.
* **Proxy/CORS behavior**: Currently, the Vite config lacks a proxy, and neither backend configures CORS. Since they operate on different ports (e.g. 3000 vs 5000), Cross-Origin Resource Sharing (CORS) must be explicitly enabled on the unified server, or the Vite config must proxy `/api` to the backend port.

## WebSocket Infrastructure
* **Findings**: No `socket.io` or WebSocket servers were detected in either `app.js` or `app.ts`.

## Route Collision Analysis
* **Collisions**: **None**.
* Member 1 strictly uses top-level resource paths (`/api/events`, etc.).
* Judging strictly isolates its routes under the `/api/judging` namespace prefix.
* The unified server can safely mount both without overlap.

## Recommended Composition Strategy
1. **Entrypoint Modernization**: Create a new unified entrypoint `backend/server.ts` that relies on `ts-node` or `tsx` (which supports both ES Modules/TS and CommonJS seamlessly).
2. **Member 1 Adjustment**: Modify `app.js` to conditionally `listen()` only if executed directly, or simply remove `app.listen` and export the `app` instance.
3. **Mounting**: In `server.ts`, import the Member 1 `app` as the base application, then import the `judgingRouter` from `backend/src/api/judging.routes.ts` and mount it via `app.use('/api/judging', judgingRouter)`.
4. **Middleware Duplication**: Both create `express.json()`. If we mount Judging router directly into Member 1's `app`, we don't need Judging's separate `app.ts` anymore.
5. **CORS**: Install and configure the `cors` middleware at the top level of the unified app to accept requests from the Vite frontend (port 3000).

## Risks
* **TypeScript vs CommonJS Interoperability**: Member 1 is purely CommonJS. Judging is TypeScript. Care must be taken to ensure the runner (`tsx`) resolves Member 1's local `require` statements correctly.
* **Database Connections**: The unified server will concurrently maintain open connection pools to MongoDB and PostgreSQL.

## Exact Files That Would Need Modification
* `backend/backend-platform/backend/src/app.js` (Export `app` instead of listening)
* `backend/package.json` (Add start script for unified server)
* `backend/server.ts` (Create new unified entrypoint)
* `backend/src/api/app.ts` (Potentially delete, bypass to directly mount `judging.routes.ts`)
* `frontend/frontend-platform/vite.config.ts` (Add API proxy to port 5000)
