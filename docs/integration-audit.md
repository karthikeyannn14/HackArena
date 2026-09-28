# Integration Audit

## Actual Repository Tree (Discovered)
The machine currently has two conflicting repository roots due to an earlier migration error:
1. `D:\DogFOOD Hackyy (2)\DogFOOD Hackyy\DogFOOD Hackyy` (User's active directory containing the intended platform).
2. `d:\DogFOOD Hackyy` (Agent's primary workspace mapping).

Inside the active repository (`D:\DogFOOD Hackyy (2)\DogFOOD Hackyy\DogFOOD Hackyy`), the structure contains:
```text
frontend/
├── frontend-platform/  (Intended frontend)
├── src/                (Incorrect/Duplicate demo app)
├── package.json        (Incorrect/Duplicate demo app)
└── ...
backend/
├── backend-platform/   (Intended backend)
├── server.ts           (Incorrect/Duplicate demo server)
├── src/                (Incorrect/Duplicate demo code)
└── ...
```

## Intended vs Actual Locations
* **Intended frontend location:** `frontend/frontend-platform`
* **Actual frontend currently being served (at localhost:5173):** The duplicate demo app located directly in `frontend/`
* **Intended backend location:** `backend/backend-platform`
* **Actual backend currently running (at localhost:5000):** The duplicate demo server located directly in `backend/`

## Entrypoints & Ports
* **Frontend entrypoint:** `frontend/frontend-platform/src/main.tsx` (Intended) vs `frontend/src/main.tsx` (Actual served)
* **Backend entrypoint:** `backend/backend-platform/server.ts` (Intended) vs `backend/server.ts` (Actual served)
* **Frontend port:** 5173 (Currently bound by the duplicate app)
* **Backend port:** 5000 (Currently bound by the duplicate server)
* **Vite proxy configuration:** To be determined in `frontend/frontend-platform/vite.config.ts`.
* **API base URL:** To be determined in `frontend/frontend-platform` API clients.

## Conflicting/Duplicate Applications & Misplacements
An earlier agent incorrectly scaffolded a brand new Vite app directly into `frontend/` and a new Express server into `backend/`, bypassing the intended `-platform` subdirectories. 
- **Duplicate frontend:** `frontend/package.json`, `frontend/src/*`, `frontend/public/*`, `frontend/vite.config.ts` are all incorrectly placed and overriding the intended application.
- **Duplicate backend:** `backend/server.ts`, `backend/package.json`, `backend/tsconfig.json`, `backend/seed.ts` are incorrectly placed and running instead of `backend-platform`.

All incorrect files will be removed/isolated, and the correct applications will be started.
