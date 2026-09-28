# Branding Audit: DevPulse -> HackArena

## Category A: User-Visible Branding (MUST CHANGE)

1. `frontend/frontend-platform/index.html`
   - Location: `<title>DevPulse Hackathon Platform</title>`
   - Existing text: `DevPulse Hackathon Platform`
   - Should rename: YES (to `HackArena`)
   
2. `frontend/frontend-platform/index.html`
   - Location: `<meta property="og:title" content="DevPulse Hackathon Platform" />`
   - Existing text: `DevPulse Hackathon Platform`
   - Should rename: YES (to `HackArena`)
   
3. `frontend/frontend-platform/src/components/layout/Navbar.tsx`
   - Location: Logo / Header text
   - Existing text: `DevPulse`
   - Should rename: YES (to `HackArena`)

4. `frontend/frontend-platform/src/components/layout/Footer.tsx`
   - Location: Copyright / Footer text
   - Existing text: `DevPulse`
   - Should rename: YES (to `HackArena`)

5. `frontend/frontend-platform/src/pages/public/HomePage.tsx`
   - Location: Hero Section / Welcome text
   - Existing text: `DevPulse`
   - Should rename: YES (to `HackArena`)

6. `frontend/frontend-platform/src/pages/auth/LoginPage.tsx`
   - Location: Login Header / Welcome message
   - Existing text: `DevPulse`
   - Should rename: YES (to `HackArena`)

7. `frontend/frontend-platform/src/pages/auth/RegisterPage.tsx`
   - Location: Register Header
   - Existing text: `DevPulse`
   - Should rename: YES (to `HackArena`)

8. `README.md` (and other docs if applicable)
   - Location: Product description headers
   - Existing text: `DevPulse`
   - Should rename: YES (to `HackArena`, preserving historical mentions)


## Category B: Technical Identifiers (DO NOT CHANGE)

1. `frontend/frontend-platform/src/services/api/client.ts`
   - Location: `localStorage.getItem('devpulse_jwt_token')`
   - Existing text: `devpulse_jwt_token`
   - Should rename: NO (Technical JWT key)

2. `frontend/frontend-platform/src/services/api/storage.ts`
   - Location: `const TOKEN_KEY = 'devpulse_jwt_token'`
   - Existing text: `devpulse_jwt_token`
   - Should rename: NO (Technical JWT key)

3. `backend/server.ts`
   - Location: `const JWT_SECRET = process.env.JWT_SECRET || 'devpulse_jwt_token_secret'`
   - Existing text: `devpulse_jwt_token_secret`
   - Should rename: NO (Technical secret key)

4. Mock Data Files (e.g. `frontend/frontend-platform/src/mock/data.ts`)
   - Location: Variable IDs / internal mock string fixtures
   - Existing text: `devpulse` references in test fixtures
   - Should rename: NO (Unless explicitly rendered in public empty states as the brand name)

5. Database Schema / Migrations
   - Should rename: NO

## Category C: Possibly Both / Needs Review

1. `frontend/frontend-platform/src/mock/data.ts`
   - Location: Hardcoded event titles e.g. "DevPulse Annual Hackathon"
   - Existing text: `DevPulse Annual Hackathon`
   - Decision: Since mock data is rendered in the UI empty states during demo, it is considered User-Visible.
   - Should rename: YES (to `HackArena Annual Hackathon`)
