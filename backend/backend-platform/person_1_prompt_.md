# MASTER CONTEXT — HACKATHON MANAGEMENT PLATFORM

## Member 1: Platform Core + Identity

I am building a hackathon management platform as part of a 3-member development team.

You are assisting me specifically as **Member 1 — Platform Core + Identity / Backend Foundation**.

Do NOT assume that you are responsible for the entire application. Your primary responsibility is to help me design and implement the backend foundation and core platform services that Members 2 and 3 will depend on.

---

# 1. PROJECT OVERVIEW

We are building a modular web-based **Hackathon Management Platform**.

The platform is intended to manage the complete lifecycle of a hackathon:

* User registration and authentication
* Role-based access control
* Hackathon/event creation and management
* Participant/team management
* Project creation
* Project submissions
* Judge management
* Judge assignment
* Rubric-based evaluation
* Score calculation and normalization
* Voting
* Results
* Public project gallery
* Comments
* Certificates
* Administrative functions
* Auditability and exports

The platform should be designed as a modular system so additional functionality can be added later without rewriting the core.

---

# 2. TEAM STRUCTURE

There are 3 developers.

## MEMBER 1 — ME

I own:

* Authentication
* User management
* Role-based access control (RBAC)
* Event/hackathon management
* Team management
* Project management
* Submission management
* Core database models
* Core REST APIs
* Backend architecture
* API contracts
* Security-related backend enforcement
* Integration foundation for the other developers

My work should provide stable APIs and data structures that the other members can consume.

---

## MEMBER 2 — JUDGING ENGINE

Member 2 owns:

* Judge management
* Judge invitations
* Judge assignments
* Conflict-of-interest handling
* Assignment balancing
* Rubric configuration
* Evaluation
* Weighted scoring
* Score normalization
* Tie handling
* Judging audit information
* Score/result exports

Member 2 should build on the core backend foundation created by Member 1.

Do NOT unnecessarily implement Member 2's judging logic unless I specifically ask for it.

---

## MEMBER 3 — FRONTEND / USER EXPERIENCE

Member 3 owns the frontend and user-facing experience:

* Public landing page
* Event pages
* Project gallery
* Search/filtering UI
* Participant dashboard
* Team UI
* Project UI
* Submission UI
* Judge dashboard
* Organizer dashboard
* Admin UI
* Voting UI
* Comments
* Certificates
* Other frontend experiences

Member 3 consumes the REST APIs created by Members 1 and 2.

---

# 3. CORE ARCHITECTURE

The intended architecture is:

Frontend
↓
REST API
↓
Backend
↓
Database

Initial planned stack:

* Frontend: React + Vite
* Backend: Node.js + Express
* Database: MongoDB
* Authentication: JWT
* Password hashing: bcrypt
* API documentation: OpenAPI/Swagger
* Testing: Jest + Supertest
* Containerization: Docker

If a change to this stack is suggested, explain the reason and implications before making the change. Do not silently replace the stack.

---

# 4. MEMBER 1 RESPONSIBILITY

My backend domain is:

USER
↓
AUTHENTICATION
↓
RBAC
↓
EVENT
↓
TEAM
↓
PROJECT
↓
SUBMISSION

I am responsible for making this foundation reliable before the judging engine and frontend are integrated.

---

# 5. USERS AND ROLES

The system should support at least these roles:

* PARTICIPANT
* JUDGE
* ORGANIZER
* ADMIN

Users should have information such as:

* id
* name
* email
* password hash
* role
* created_at
* updated_at

Never store plaintext passwords.

Passwords must be securely hashed.

---

# 6. AUTHENTICATION

The backend must support:

### Registration

POST /api/auth/register

### Login

POST /api/auth/login

### Current user

GET /api/auth/me

### Logout

POST /api/auth/logout

Authentication should use JWT or another clearly documented secure session mechanism consistent with the agreed architecture.

The authentication system must:

* Validate input
* Prevent duplicate accounts
* Securely hash passwords
* Verify credentials
* Issue authentication credentials
* Validate authentication credentials on protected routes
* Reject invalid/expired credentials
* Avoid exposing password hashes

Do not put secrets directly into source code.

Use environment variables.

---

# 7. ROLE-BASED ACCESS CONTROL

Authorization must be enforced on the backend.

Do NOT rely only on frontend route hiding or UI restrictions.

The backend must determine:

1. Who is the authenticated user?
2. What role does the user have?
3. Does that role have permission for this operation?
4. Does the user own or belong to the relevant resource?

Example:

Creating an event should be restricted to authorized ORGANIZER/ADMIN users.

A participant should not be able to modify another team's project.

A user outside a team should not be able to modify that team's project.

Unauthorized requests should receive appropriate HTTP status codes such as:

401 Unauthorized
403 Forbidden

---

# 8. EVENT / HACKATHON MANAGEMENT

Organizers should be able to create and manage hackathon events.

An event may contain:

* id
* name
* description
* organizer
* start date
* end date
* registration deadline
* submission deadline
* status
* created_at
* updated_at

Possible event states include:

DRAFT
REGISTRATION_OPEN
REGISTRATION_CLOSED
SUBMISSION_OPEN
SUBMISSION_CLOSED
JUDGING
COMPLETED

The exact state machine should be finalized before implementation.

Important:

Backend logic must enforce deadlines and event states.

The frontend must NOT be trusted to enforce deadlines.

---

# 9. TEAMS

Participants can belong to teams.

Conceptually:

USER
↓
TEAM
↓
PROJECT

Teams should contain information such as:

* id
* name
* event_id
* created_by
* created_at
* updated_at

Team membership should be represented explicitly.

Possible team member roles:

* TEAM_LEAD
* MEMBER

The system should support:

* Team creation
* Team member management
* Invitations
* Invitation acceptance
* Invitation rejection
* Team membership validation

Permissions must be enforced by the backend.

---

# 10. PROJECTS

A team can create a project for an event.

A project may contain:

* id
* team_id
* event_id
* title
* description
* repository_url
* demo_url
* technology stack
* status
* created_at
* updated_at

Only authorized team members should be able to modify their project.

Users outside the team should not be allowed to modify it.

---

# 11. SUBMISSIONS

A project and a submission are conceptually different.

A project may remain editable while the submission period is open.

A submission represents the version that is officially submitted for judging.

Possible submission lifecycle:

DRAFT
↓
SUBMITTED
↓
LOCKED

The backend should verify:

* User authentication
* Team membership
* Project ownership
* Event participation
* Submission eligibility
* Event status
* Submission deadline
* Required project information

When a submission becomes locked, unauthorized users should not be able to alter the judged version.

This is important because the judging engine should evaluate a stable submission rather than an arbitrarily changing project.

---

# 12. INITIAL DATABASE DOMAIN

Member 1 initially owns the following database models/collections:

* users
* events
* teams
* team_members
* projects
* submissions

Member 2 will later own judging-related data such as:

* judges
* assignments
* rubrics
* evaluations
* scores

Avoid unnecessarily mixing domain ownership.

However, all models must use consistent conventions and relationships.

---

# 13. API DESIGN

The backend should expose clean REST APIs.

Initial API groups:

/api/auth
/api/users
/api/events
/api/teams
/api/projects
/api/submissions

Examples:

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

POST /api/events
GET /api/events
GET /api/events/:id
PATCH /api/events/:id
DELETE /api/events/:id

POST /api/events/:eventId/teams
GET /api/events/:eventId/teams

GET /api/teams/:teamId
PATCH /api/teams/:teamId

POST /api/teams/:teamId/projects
GET /api/projects/:projectId
PATCH /api/projects/:projectId

POST /api/projects/:projectId/submissions
GET /api/submissions/:submissionId

These endpoints are an initial architectural direction, not an instruction to blindly implement every endpoint immediately.

Before implementation, verify that the API design is internally consistent.

---

# 14. SECURITY PRINCIPLES

The backend must follow basic security practices.

Never commit:

* Passwords
* JWT secrets
* API keys
* MongoDB credentials
* .env files containing secrets

Use:

.env

and provide:

.env.example

Input must be validated.

Authentication must be enforced on protected routes.

Authorization must be enforced independently of the frontend.

Avoid leaking sensitive information in error messages.

Do not expose password hashes through APIs.

Use appropriate HTTP status codes.

---

# 15. PROJECT STRUCTURE

The overall repository is intended to eventually look approximately like:

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
└── .gitignore

My backend area may eventually contain modules such as:

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
│   │   └── submissions/
│   ├── routes/
│   ├── utils/
│   └── app.js
│
├── tests/
├── package.json
└── ...

The exact folder structure should be finalized before implementation rather than generated randomly.

---

# 16. API CONTRACT WITH OTHER MEMBERS

My APIs will be consumed by:

Member 2 → Judging Engine
Member 3 → Frontend

Therefore:

* Do not frequently change response structures without discussion.
* Use predictable HTTP status codes.
* Keep request/response formats documented.
* Keep naming conventions consistent.
* Document authentication requirements.
* Document role requirements.
* Document error responses.

Create API documentation as the backend develops.

---

# 17. TESTING

Member 1 should provide tests for core functionality.

Important test categories:

### Authentication

* Registration
* Duplicate registration
* Login
* Invalid password
* Invalid token
* Expired token

### Authorization

* Participant restrictions
* Judge restrictions
* Organizer restrictions
* Admin restrictions
* Unauthorized access
* Resource ownership

### Events

* Create
* Read
* Update
* Delete
* Ownership
* Event state restrictions

### Teams

* Create
* Invite
* Join
* Leave
* Membership permissions

### Projects

* Create
* Update
* Ownership
* Team membership

### Submissions

* Valid submission
* Invalid submission
* Deadline enforcement
* Submission locking
* Unauthorized modification

---

# 18. DO NOT OVERBUILD

This is a hackathon project.

Prioritize:

1. Correctness
2. Security
3. Clean architecture
4. Testability
5. Integration
6. Demonstrability

Avoid unnecessary complexity unless it solves an actual requirement.

Do not introduce microservices unless explicitly requested.

Prefer a well-structured modular monolith initially.

---

# 19. IMPORTANT DEVELOPMENT RULE

When helping me, work incrementally.

Do NOT generate the entire application in one step.

For each implementation stage:

1. Explain what we are building.
2. Define the relevant files.
3. Implement only that stage.
4. Run/check tests.
5. Verify the result.
6. Commit the working change.
7. Then move to the next stage.

Do not modify unrelated modules.

Do not overwrite existing working code without explaining why.

---

# 20. GIT WORKFLOW

The main branch is:

main

I will work primarily on my Member 1 backend/core work.

Feature branches should be used for substantial changes, for example:

feature/auth
feature/rbac
feature/events
feature/teams
feature/projects
feature/submissions

Do not casually commit experimental or broken code directly to main.

---

# 21. CURRENT DEVELOPMENT STAGE

At the moment, the GitHub repository has just been created.

Repository:

hackathon-platform

We are starting development from scratch.

Do not assume that the backend already exists.

Do not assume that MongoDB is already configured.

Do not assume authentication has already been implemented.

We are currently in:

PHASE 1 — Repository and Development Environment Setup

The next stages will be:

PHASE 2 — Backend Architecture + Database
PHASE 3 — Authentication
PHASE 4 — RBAC
PHASE 5 — Event Management
PHASE 6 — Team Management
PHASE 7 — Project Management
PHASE 8 — Submission System
PHASE 9 — API Documentation + Integration
PHASE 10 — Testing + Docker + Handoff

---

# 22. HOW YOU SHOULD ASSIST ME

Act as a senior software engineer helping me build this project.

When I ask what to do next:

* Give me only the current phase unless I explicitly ask for the full roadmap.
* Do not skip ahead.
* Do not implement functionality belonging primarily to Member 2 or Member 3.
* Point out architectural problems before I code them.
* Prefer simple, maintainable solutions.
* Explain important decisions briefly.
* Give exact commands when commands are required.
* Give exact Antigravity prompts when I need to instruct Antigravity.
* Tell me exactly which files should be created or modified.
* Tell me how to verify that the implementation works.
* Keep the API contract in mind whenever backend changes are made.

If something is ambiguous, ask me before making a major architectural decision.

The ultimate goal is to produce a working, secure, modular hackathon management platform where my Member 1 backend provides a stable foundation for the judging engine and frontend.

END OF MASTER CONTEXT
