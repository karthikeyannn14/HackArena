# MASTER SOFTWARE MODEL

## Hackathon Management Platform — Complete System Specification

You are assisting a 3-member development team building a modular **Hackathon Management Platform**.

This document is the shared source of truth for the overall software architecture, responsibilities, modules, workflows, integration boundaries, and development strategy.

The system must be designed as **one cohesive application**, not as three independent projects.

The three developers will work on separate domains but must follow the same architecture, database conventions, API contracts, security rules, and integration strategy.

---

# 1. PRODUCT VISION

Build a complete web-based platform for managing the lifecycle of a hackathon.

The platform should allow:

* Organizers to create and manage hackathons
* Participants to register and form teams
* Teams to create projects
* Teams to submit projects before deadlines
* Judges to receive project assignments
* Judges to evaluate projects using configurable rubrics
* The system to calculate and normalize scores
* Organizers to manage judging and results
* Participants and visitors to view projects and results
* Users to interact through voting/comments where applicable
* Certificates and other post-event features to be generated
* Administrators to manage the platform
* Important actions to be auditable

The architecture must allow additional features to be added without requiring major rewrites.

---

# 2. CORE PRODUCT PRINCIPLE

The system should follow:

SECURITY
+
CORRECTNESS
+
MODULARITY
+
AUDITABILITY
+
TESTABILITY
+
GOOD USER EXPERIENCE

The system should not sacrifice backend security merely because a feature can be hidden in the frontend.

The backend is the final authority for:

* Authentication
* Authorization
* Ownership
* Deadlines
* Event states
* Submission states
* Judging permissions
* Data integrity

---

# 3. HIGH-LEVEL SYSTEM ARCHITECTURE

The initial architecture is a modular monolith.

```text
                         ┌─────────────────────┐
                         │      FRONTEND       │
                         │     React + Vite    │
                         └──────────┬──────────┘
                                    │
                                    │ REST API
                                    ↓
                         ┌─────────────────────┐
                         │       BACKEND       │
                         │ Node.js + Express   │
                         └──────────┬──────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ↓                    ↓                    ↓
          Identity/Core          Judging              Future
          Modules               Modules               Modules
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    ↓
                         ┌─────────────────────┐
                         │      MongoDB        │
                         └─────────────────────┘
```

The backend should initially remain a **modular monolith**, rather than being split into microservices.

---

# 4. INITIAL TECHNOLOGY STACK

Unless the team explicitly changes this decision:

### Frontend

React + Vite

### Backend

Node.js + Express

### Database

MongoDB

### Authentication

JWT-based authentication

### Password hashing

bcrypt

### API documentation

OpenAPI / Swagger

### Testing

Jest + Supertest

### Containerization

Docker

---

# 5. THREE-MEMBER OWNERSHIP MODEL

The project is divided into three major domains.

```text
                    COMPLETE PLATFORM
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
         MEMBER 1       MEMBER 2       MEMBER 3
          CORE          JUDGING        FRONTEND
```

---

# 6. MEMBER 1 — PLATFORM CORE + IDENTITY

Member 1 owns the foundation of the platform.

Primary responsibilities:

### Identity

* User registration
* Login
* Logout/session handling
* Password hashing
* JWT authentication
* User profile basics

### Authorization

* RBAC
* Role validation
* Permission enforcement
* Resource ownership checks

### Event Management

* Create event
* Update event
* Event lifecycle
* Event configuration
* Event deadlines

### Team Management

* Team creation
* Team membership
* Team invitations
* Team roles
* Team validation

### Project Management

* Project creation
* Project editing
* Project ownership
* Project metadata

### Submission Management

* Submission creation
* Submission validation
* Submission lifecycle
* Deadline enforcement
* Submission locking

### Core Database Models

Member 1 initially owns:

```text
users
events
teams
team_members
projects
submissions
```

### Core API

Member 1 provides the REST APIs consumed by the other domains.

---

# 7. MEMBER 2 — JUDGING ENGINE

Member 2 owns the complete judging domain.

Primary responsibilities:

### Judge Management

* Judge profiles
* Judge invitations
* Judge availability
* Judge activation/deactivation

### Judge Assignment

* Assign judges to projects
* Prevent conflicts of interest
* Balance judge workload
* Support deterministic assignment
* Store assignment information

### Rubrics

* Create rubric
* Configure criteria
* Configure weights
* Validate total weights

Example:

```text
Innovation       25%
Technical        30%
Impact           20%
Presentation     15%
Feasibility      10%
```

### Evaluation

Judges should be able to evaluate assigned submissions.

Example:

```text
Judge
 ↓
Assigned Project
 ↓
Rubric
 ↓
Criterion Scores
 ↓
Evaluation
```

### Score Processing

Member 2 owns:

* Weighted scores
* Score aggregation
* Normalization
* Tie handling
* Final score calculation

### Auditability

Judging operations should record relevant information such as:

* Judge
* Project/submission
* Assignment
* Algorithm/version
* Timestamp
* Relevant configuration

### Judging Models

Member 2 may own models such as:

```text
judges
judge_assignments
rubrics
rubric_criteria
evaluations
scores
```

Member 2 should integrate with Member 1's users, events, projects and submissions rather than creating duplicate user/project systems.

---

# 8. MEMBER 3 — FRONTEND + USER EXPERIENCE

Member 3 owns the user-facing experience.

### Public Experience

* Landing page
* Event discovery
* Event details
* Project gallery
* Project details
* Search
* Filtering
* Results

### Participant Experience

* Registration
* Dashboard
* Team management
* Project management
* Submission

### Judge Experience

* Judge dashboard
* Assigned projects
* Evaluation forms
* Progress tracking

### Organizer Experience

* Organizer dashboard
* Event management
* Team management
* Judge management
* Assignment overview
* Results

### Admin Experience

* User management
* Platform management
* Event oversight
* Administrative controls

### Later Features

* Voting
* Comments
* Certificates
* Embeddable gallery
* Other presentation features

Member 3 consumes the backend APIs.

The frontend must not duplicate backend authorization logic as the source of truth.

---

# 9. USER ROLES

The platform should initially support:

```text
PARTICIPANT
JUDGE
ORGANIZER
ADMIN
```

Roles should be represented consistently throughout the system.

The backend must enforce permissions.

---

# 10. CORE DOMAIN RELATIONSHIPS

The main relationship is:

```text
USER
 │
 ├───────────────┐
 │               │
 ↓               ↓
TEAM           EVENT
 │               │
 ↓               │
PROJECT ─────────┘
 │
 ↓
SUBMISSION
 │
 ↓
JUDGING
 │
 ↓
EVALUATION
 │
 ↓
SCORES
 │
 ↓
RESULTS
```

A submission should represent a stable version of the project that is eligible for judging.

---

# 11. EVENT LIFECYCLE

The event may follow:

```text
DRAFT
  ↓
REGISTRATION_OPEN
  ↓
REGISTRATION_CLOSED
  ↓
SUBMISSION_OPEN
  ↓
SUBMISSION_CLOSED
  ↓
JUDGING
  ↓
COMPLETED
```

The exact state machine should be implemented consistently.

The backend must prevent invalid transitions.

For example:

A participant must not submit after the submission deadline merely because the frontend still displays a submit button.

---

# 12. TEAM WORKFLOW

Typical participant workflow:

```text
Register
   ↓
Join/Create Team
   ↓
Invite Members
   ↓
Create Project
   ↓
Edit Project
   ↓
Submit
```

Team membership and permissions must be enforced by the backend.

---

# 13. PROJECT WORKFLOW

```text
Create Project
      ↓
Draft
      ↓
Edit
      ↓
Submit
      ↓
Locked Submission
      ↓
Judging
```

Once the judged submission is locked, unauthorized modification must be prevented.

---

# 14. JUDGING WORKFLOW

The judging process should conceptually work as:

```text
Organizer
   ↓
Configure Rubric
   ↓
Register Judges
   ↓
Assignment Engine
   ↓
Judge → Assigned Submissions
   ↓
Judge Evaluations
   ↓
Raw Scores
   ↓
Normalization
   ↓
Weighted Scores
   ↓
Final Scores
   ↓
Results
```

The assignment and scoring algorithms must be deterministic and auditable where applicable.

---

# 15. ASSIGNMENT SYSTEM

The assignment system should eventually support:

* Judge-project assignment
* Workload balancing
* Conflict avoidance
* Configurable number of judges per project
* Deterministic assignment
* Reproducibility

Important assignment information should be persisted.

For deterministic algorithms, consider recording:

```text
algorithm_version
seed
assignment_timestamp
configuration
```

This allows an assignment process to be explained or reproduced.

---

# 16. RUBRIC SYSTEM

Rubrics should be configurable.

A rubric consists of criteria.

Example:

```text
Rubric
│
├── Innovation       25%
├── Technical        30%
├── Impact           20%
├── Presentation     15%
└── Feasibility      10%
```

The backend should validate:

```text
sum(weights) = 100%
```

or use another explicitly documented normalization convention.

Do not silently invent scoring rules.

---

# 17. SCORE PROCESSING

Conceptually:

```text
Raw Judge Scores
       ↓
Validation
       ↓
Weighted Score
       ↓
Normalization
       ↓
Aggregation
       ↓
Final Score
```

The exact mathematical method must be explicitly documented.

Different scoring mechanisms should not be mixed without a defined specification.

---

# 18. API ARCHITECTURE

The backend should expose modular REST APIs.

Example:

```text
/api/auth
/api/users
/api/events
/api/teams
/api/projects
/api/submissions

/api/judges
/api/assignments
/api/rubrics
/api/evaluations
/api/results
```

Member 1 owns the core endpoints.

Member 2 owns judging endpoints.

Member 3 consumes the endpoints and does not directly access the database.

---

# 19. API CONTRACT RULE

All developers must follow a shared API contract.

Every API should document:

* HTTP method
* Endpoint
* Authentication requirement
* Required role
* Request body
* Query parameters
* Response structure
* Error responses
* Status codes

Avoid unnecessary breaking changes.

If an API must change, communicate the change before implementing dependent code.

---

# 20. DATABASE OWNERSHIP

Avoid duplicate representations of the same domain.

For example:

There should be one authoritative user model.

Member 2 should reference Member 1's user rather than creating another independent user system.

Likewise, judging should reference the existing:

* event
* project
* submission
* user

models.

---

# 21. SECURITY MODEL

Security is a backend responsibility.

The system must:

* Hash passwords
* Protect credentials
* Validate authentication
* Validate authorization
* Validate ownership
* Validate deadlines
* Validate event state
* Validate submission state
* Validate request data
* Avoid exposing secrets
* Avoid exposing password hashes

Never commit:

```text
.env
API keys
database passwords
JWT secrets
private credentials
```

Provide:

```text
.env.example
```

instead.

---

# 22. FRONTEND SECURITY PRINCIPLE

Hiding a button is NOT authorization.

For example:

```text
Frontend:
Hide "Delete Event" button
```

does not mean the operation is secure.

The backend must still reject:

```text
DELETE /api/events/:id
```

when the caller lacks permission.

---

# 23. ERROR HANDLING

Use consistent HTTP semantics.

Examples:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

Do not expose internal stack traces or sensitive information to normal clients.

---

# 24. TESTING STRATEGY

Testing should happen continuously.

### Member 1 tests

* Authentication
* Authorization
* Users
* Events
* Teams
* Projects
* Submissions

### Member 2 tests

* Assignment
* Conflict detection
* Rubrics
* Evaluations
* Score calculations
* Normalization
* Tie handling

### Member 3 tests

* UI components
* User flows
* Forms
* Navigation
* API integration
* Critical end-to-end workflows

---

# 25. INTEGRATION STRATEGY

Development should happen in stages.

## Stage 1 — Foundation

Member 1:

```text
Repository
Backend
Database
Authentication
RBAC
```

Member 2:

```text
Judging algorithm design
```

Member 3:

```text
Frontend architecture/design
```

---

## Stage 2 — Core Platform

Member 1:

```text
Events
Teams
Projects
Submissions
```

Member 2:

```text
Judge management
Assignments
Rubrics
```

Member 3:

```text
Participant UI
Organizer UI
Judge UI
```

---

## Stage 3 — Integration

Integrate:

```text
Frontend
   ↓
Member 1 APIs
   ↓
Member 2 APIs
   ↓
Database
```

Test complete workflows.

---

## Stage 4 — Advanced Features

Potential features:

```text
Voting
Comments
Public gallery
Results
Certificates
Admin tools
Exports
Audit logs
```

These should be added only after the core workflow is stable.

---

# 26. DEVELOPMENT PHASES

The overall development plan is:

```text
PHASE 1
Repository + Development Environment

PHASE 2
Backend Architecture + Database

PHASE 3
Authentication

PHASE 4
RBAC

PHASE 5
Event Management

PHASE 6
Team Management

PHASE 7
Project Management

PHASE 8
Submission System

PHASE 9
Judging Integration

PHASE 10
Frontend Integration

PHASE 11
Advanced Features

PHASE 12
Testing + Security + Docker + Final Demo
```

The team should not blindly jump between phases.

Each phase should produce a working increment.

---

# 27. GIT STRATEGY

Use:

```text
main
```

as the stable branch.

Feature branches may include:

```text
feature/auth
feature/rbac
feature/events
feature/teams
feature/projects
feature/submissions
feature/judging
feature/frontend
```

Do not merge knowingly broken functionality into main.

Before merging:

```text
Build passes
Tests pass
API contract remains valid
No secrets committed
Docker/build remains functional
```

---

# 28. DOCUMENTATION

The repository should eventually contain:

```text
docs/
├── ARCHITECTURE.md
├── API.md
├── DATABASE.md
├── AUTHENTICATION.md
├── RBAC.md
├── JUDGING.md
├── SCORING.md
└── DEVELOPMENT.md
```

Documentation should evolve alongside implementation.

---

# 29. PROJECT DIRECTORY

A possible overall repository structure:

```text
hackathon-platform/
│
├── frontend/
│
├── backend/
│
├── docs/
│
├── tests/
│
├── docker-compose.yml
├── README.md
├── .gitignore
└── .env.example
```

Backend:

```text
backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── events/
│   │   ├── teams/
│   │   ├── projects/
│   │   ├── submissions/
│   │   └── judging/
│   ├── routes/
│   ├── utils/
│   └── app.js
│
├── tests/
├── package.json
└── ...
```

This is an architectural starting point. The exact structure may be refined before implementation.

---

# 30. NON-FUNCTIONAL REQUIREMENTS

The system should aim for:

### Reliability

Important workflows should not silently fail.

### Security

Unauthorized operations must be rejected by the backend.

### Maintainability

Modules should have clear responsibilities.

### Testability

Core business logic should be independently testable.

### Auditability

Important judging and administrative actions should be traceable.

### Reproducibility

Algorithmic processes such as judge assignment should be reproducible when required.

### Scalability

The architecture should allow future growth without unnecessary complexity.

---

# 31. WHAT NOT TO DO

Do not:

* Build the entire application in one generated response.
* Allow every developer to modify every module.
* Create duplicate user/project systems.
* Put authorization exclusively in the frontend.
* Store plaintext passwords.
* Commit secrets.
* Build microservices unnecessarily.
* Change the stack without agreement.
* Change API contracts silently.
* Implement complex algorithms without documenting them.
* Add advanced features before the core workflow works.
* Generate huge amounts of unrelated code when implementing a small feature.

---

# 32. AI DEVELOPMENT RULES

Any AI assisting a team member must understand the following:

This is a shared multi-developer project.

Before modifying code:

1. Understand the current architecture.
2. Identify the responsible developer/domain.
3. Check existing code.
4. Avoid modifying unrelated modules.
5. Preserve existing API contracts.
6. Explain architectural changes.
7. Implement incrementally.
8. Test the change.
9. Report exactly what was changed.
10. Identify anything another team member needs to know.

Never assume missing code exists.

Never invent an API or database model without checking the current architecture.

---

# 33. CURRENT PROJECT STATUS

The project is currently being started from scratch.

The GitHub repository has been created:

hackathon-platform

The team is currently beginning:

PHASE 1 — Repository + Development Environment Setup

Member 1 is currently responsible for setting up the backend foundation.

The system has NOT yet been assumed to have:

* Backend code
* Database configuration
* Authentication
* RBAC
* APIs
* Frontend
* Judging engine

These will be built incrementally.

---

# 34. CURRENT TEAM RESPONSIBILITY SUMMARY

```text
┌──────────────────────────────────────────────┐
│          HACKATHON PLATFORM                  │
├──────────────────┬───────────────┬───────────┤
│ MEMBER 1         │ MEMBER 2      │ MEMBER 3  │
│ Core + Identity  │ Judging       │ Frontend  │
├──────────────────┼───────────────┼───────────┤
│ Users            │ Judges        │ UI        │
│ Auth             │ Assignment    │ Dashboards│
│ RBAC             │ Rubrics       │ Gallery   │
│ Events           │ Evaluation    │ Search    │
│ Teams            │ Scoring       │ Voting UI │
│ Projects         │ Normalization │ Comments  │
│ Submissions      │ Results       │ Certs UI  │
│ Core APIs        │ Audit         │ UX        │
└──────────────────┴───────────────┴───────────┘
```

---

# 35. FINAL OBJECTIVE

The final system should provide a complete flow:

```text
USER REGISTRATION
       ↓
AUTHENTICATION
       ↓
EVENT
       ↓
TEAM
       ↓
PROJECT
       ↓
SUBMISSION
       ↓
JUDGE ASSIGNMENT
       ↓
RUBRIC
       ↓
EVALUATION
       ↓
SCORE PROCESSING
       ↓
RESULTS
       ↓
PUBLIC EXPERIENCE
```

All three developers must contribute to this same end-to-end system.

The architecture should make it possible for the three domains to be developed in parallel while remaining independently understandable and safely integrable.

When assisting with development, always identify which part of this architecture the requested change belongs to and respect the ownership boundaries.

END OF MASTER SOFTWARE MODEL
