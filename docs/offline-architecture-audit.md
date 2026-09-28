# Runtime Architecture Audit & Offline Capability Report

## 1. Runtime Architecture Dependencies

### Frontend
- **Framework/Libraries:** Vite, React, Tailwind CSS
- **Network Requests:** Uses `fetch` via a local proxy (`/api`) to communicate exclusively with the local unified backend.
- **External Dependencies:** Contains placeholder URLs (e.g., `https://github.com`, `https://youtube.com`) in mock data and forms, but NO runtime dependencies on external APIs.

### Unified Backend
- **Framework:** Node.js, Express, TypeScript (ts-node)
- **External Dependencies:** None. No external HTTP requests, no third-party APIs, and no cloud SDKs are utilized at runtime. 

### Databases
- **MongoDB:** Source of truth for Users, Events, Teams, Projects, and Submissions. 
- **PostgreSQL / Prisma:** Judging engine shadow database for Judges, Assignments, Rubrics, Evaluations, and Normalization. 

### Authentication
- **Local Implementation:** Fully local. Uses `bcryptjs` for password hashing and `jsonwebtoken` for issuing JWTs.
- **Verification:** Middleware locally verifies the JWT signature using a local `JWT_SECRET`. 

## 2. Dependency Classification

| Dependency | Classification | Justification |
| :--- | :--- | :--- |
| **Frontend Assets** | A. Bundled/local | Served locally via Vite. |
| **Unified Backend** | A. Bundled/local | Runs via local Node.js. |
| **MongoDB** | B. Local (separate install) | Standard open-source DB. Runs locally but requires a standalone mongod instance. |
| **PostgreSQL** | B. Local (separate install) | Standard open-source DB. A `docker-compose.yml` exists, but still requires local Docker execution and image download. |
| **Auth** | A. Bundled/local | No Auth0, Firebase, or cloud identity providers. Fully self-contained. |

**Distinction on Localhost:**
Running `localhost` fulfills the hackathon requirement here because the underlying services (MongoDB, Postgres, Node.js) are completely free, open-source, offline-capable binaries that do not require cloud subscriptions, API keys, or remote telemetry to function. 

## 3. Database Requirement Audit

**A. Can the project run entirely offline?**
Yes. Both MongoDB and PostgreSQL can operate entirely offline without internet connectivity.

**B. Does that require separately installed database servers?**
Yes. The repository currently relies on an external `mongod` process and a PostgreSQL service (via Docker or native install).

**C. Does a clean machine need internet access to obtain anything?**
Yes. A clean machine would need internet access initially to:
1. Run `npm install` for Node dependencies.
2. Download the PostgreSQL Docker image (`postgres:15-alpine`) or native binaries.
3. Download MongoDB native binaries or Docker images.

**D. Are database files/data expected to be included locally?**
No, currently there is no embedded persistence layer (like SQLite or embedded JSON files) bundled within the repository source files. Persistence requires running background daemons.

**E. Can the project be packaged so the required persistence layer starts locally without a hosted service?**
Yes, but currently it is cumbersome because it requires running two separate database technologies.

**F. Does the current two-database architecture violate any explicit hackathon constraint?**
No. It does not strictly violate the rule against "hosted databases" or "proprietary services" because both are open-source and run locally. However, it violates the spirit of a highly portable, easily launchable repository.

## 4. Authentication Audit
- **JWT Generation:** Local (`jsonwebtoken`).
- **Password Verification:** Local (`bcryptjs`).
- **User Storage:** Local (MongoDB).
- **JWT Validation:** Local middleware.
**Conclusion:** 100% compliant. No Auth-as-a-service dependencies found.

## 5. External Network Audit
A thorough `grep` search for `fetch`, `axios`, and common cloud providers (`firebase`, `supabase`, `auth0`, `clerk`) yielded:
- `fetch` is used in the frontend `apiClient`, exclusively calling relative `/api` paths.
- No `axios` is installed or used.
- No cloud SDKs exist.
- URLs found (e.g., `github.com`) are purely textual links/placeholders in UI components and mock data.
**Conclusion:** Zero external network dependencies.

## 6. Offline Launch Test: Dependency Graph

To launch offline, the following processes must be started:

```text
Machine
├── 1. MongoDB Daemon (must be installed/running externally)
├── 2. PostgreSQL Daemon (via Docker Compose or externally)
├── 3. Unified Backend (npm run start -> connects to Mongo & Postgres)
└── 4. Frontend Dev Server (npm run dev -> proxies to Backend)
```

## 7. Clean-Machine Question

**"Could a judge take the repository to a machine with no internet connection and run the complete application using only the repository plus normal local runtime dependencies?"**

**NO.**

**Exact dependency preventing it:**
While the *code* is fully offline-capable, a completely clean, offline machine cannot run this project out-of-the-box because it requires:
1. `node_modules` (must be pre-installed before going offline).
2. A running MongoDB server (not included in the repo).
3. A running PostgreSQL server (requires Docker image pull).

If the judge already had Node, MongoDB, and PostgreSQL installed on their offline machine, the app would run perfectly. However, the requirement to install and configure *two different database servers* makes local deployment highly complex for a hackathon review.

## 8. Architectural Recommendation

To achieve the SMALLEST and most portable architecture that strictly adheres to the hackathon constraints and maximizes offline "clean-machine" portability:

**Recommendation: Consolidate to a Single Embedded Database (SQLite)**
The dual MongoDB/PostgreSQL architecture creates immense deployment friction. 
1. **Migrate MongoDB collections to Prisma.**
2. **Switch Prisma's provider from PostgreSQL to SQLite.**

SQLite operates as a single local file (`.db`) directly within the repository. This would eliminate the need for *both* MongoDB and PostgreSQL daemons. A judge would only need Node.js installed to run the entire stack perfectly offline, with zero external database configuration.
