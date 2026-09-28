# Architecture

## Approved Tech Stack
The platform is built using the following core technologies, officially approved for Phase 1:

### Backend
* **Runtime:** Node.js
* **Language:** TypeScript
* **Framework:** Express
* **Database:** PostgreSQL (Self-hosted via Docker Compose)
* **ORM:** Prisma
* **Testing:** Jest

### Frontend
* **Framework:** React
* **Build Tool:** Vite
* **Language:** TypeScript

### Infrastructure
* **Containerization:** Docker & Docker Compose
* **Network:** Fully offline-capable and self-hostable. No cloud databases (Firebase/Supabase), external APIs, or hosted authentication services are permitted.

## Repository Structure

```text
/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # Core data model for the application
│   ├── src/                 # Backend source code (Express app)
│   ├── tests/               # Backend tests (Jest)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/                 # Frontend source code (React)
│   ├── package.json
│   └── vite.config.ts
├── docs/                    # Architecture and validation documentation
├── docker-compose.yml       # PostgreSQL local deployment config
├── ARCHITECTURE.md
├── DATA-MODEL.md
└── JUDGING.md
```

## Architectural Guidelines

### Immutable Judging Configurations
Once an `AssignmentRun` is executed, the configuration payload (eligible judges, conflicts, criteria, weights) is strictly frozen via JSONB serialization into the `snapshotPayload` field. No real-time updates to related foreign keys (e.g., removing a team member) can alter an active assignment run.

### Normalization Pipeline Interface
Normalization is explicitly defined as a decoupled pipeline:
`RawEvaluation -> NormalizationStrategy -> NormalizationResult -> ProjectAggregation`
The exact strategy is pending mathematical validation; the `NormalizationResult` persistence layer is completely agnostic.
