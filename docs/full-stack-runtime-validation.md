# Full-Stack Runtime Validation

## Environment
- **Operating System:** Windows
- **Node Environment:** Vite dev server + unified Express server

## Backend Startup
- **PASS / FAIL / BLOCKED:** FAIL
- **Endpoint/workflow:** Unified backend startup (`npx tsx server.ts`)
- **Expected result:** Server listens on port 5000 and connects successfully to MongoDB and Prisma.
- **Observed result:** Server exits immediately after startup with: `MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017`.
- **Notes:** The backend calls `process.exit(1)` when the initial MongoDB connection fails, causing the unified server to crash.

## Frontend Startup
- **PASS / FAIL / BLOCKED:** PASS
- **Endpoint/workflow:** Vite dev server (`npm run dev`)
- **Expected result:** Vite starts and proxies `/api` to port 5000.
- **Observed result:** Started successfully on port 3000.
- **Notes:** The proxy will fail at runtime because the backend crashed.

## Authentication Test
- **PASS / FAIL / BLOCKED:** BLOCKED
- **Endpoint/workflow:** `POST /api/auth/login`
- **Expected result:** Return real JWT.
- **Observed result:** Blocked because backend is offline.
- **Notes:** Requires MongoDB.

## Member 1 API Test
- **PASS / FAIL / BLOCKED:** BLOCKED
- **Endpoint/workflow:** Member 1 API endpoints
- **Expected result:** JSON data from MongoDB.
- **Observed result:** Blocked.
- **Notes:** Requires MongoDB.

## Judging API Test
- **PASS / FAIL / BLOCKED:** BLOCKED
- **Endpoint/workflow:** Judging API endpoints
- **Expected result:** Successful routing and execution via Prisma.
- **Observed result:** Blocked.
- **Notes:** Requires unified server.

## Actor-ID Security Test
- **PASS / FAIL / BLOCKED:** BLOCKED
- **Endpoint/workflow:** JWT spoofing prevention
- **Expected result:** Rejection of client `x-actor-id`.
- **Observed result:** Blocked.
- **Notes:** Backend is offline.

## Invalid JWT Test
- **PASS / FAIL / BLOCKED:** BLOCKED
- **Endpoint/workflow:** Unauthenticated request handling
- **Expected result:** 401 Unauthorized.
- **Observed result:** Blocked.
- **Notes:** Backend is offline.

## Shadow Record Test
- **PASS / FAIL / BLOCKED:** BLOCKED
- **Endpoint/workflow:** MongoDB to Prisma shadow sync
- **Expected result:** Records map correctly.
- **Observed result:** Blocked.
- **Notes:** MongoDB is unreachable.

## Judging Workflow Test
- **PASS / FAIL / BLOCKED:** BLOCKED
- **Endpoint/workflow:** Complete judging loop
- **Expected result:** Flow completes successfully.
- **Observed result:** Blocked.
- **Notes:** Backend is offline.

## Mock Mode Verification
- **PASS / FAIL / BLOCKED:** PASS
- **Endpoint/workflow:** `VITE_USE_MOCK_API`
- **Expected result:** Mock mode is disabled.
- **Observed result:** Confirmed `.env.local` contains `VITE_USE_MOCK_API=false` and frontend uses HTTP client.
- **Notes:** Verified statically.

## Browser Console / Network Results
- **PASS / FAIL / BLOCKED:** BLOCKED
- **Endpoint/workflow:** Runtime browser inspection
- **Expected result:** No console errors, valid proxying.
- **Observed result:** Blocked.
- **Notes:** Backend is offline.

## Database Consistency
- **PASS / FAIL / BLOCKED:** BLOCKED
- **Endpoint/workflow:** Data consistency
- **Expected result:** No desync between Mongo and Prisma.
- **Observed result:** Blocked.
- **Notes:** MongoDB is offline.

## Overall Result
**BLOCKED**

**Root Cause:**
The Member 1 backend configuration (`backend-platform/backend/src/config/database.js`) enforces a hard exit (`process.exit(1)`) when the MongoDB connection fails on startup. Since MongoDB (`127.0.0.1:27017`) is not running in this environment, the unified backend crashes immediately, blocking all frontend integration testing.

**Smallest possible fix:**
Ensure a MongoDB instance is running locally on port 27017 before starting the unified server.
