# DevNest

DevNest is a full-stack developer community platform built for the Agentic Software Engineer Intern assignment. Developers can publish ranked posts, discuss them through threaded replies, react with likes/dislikes, and maintain public profiles.

## Stack

- React + TypeScript + Vite
- Express + TypeScript
- Drizzle ORM + PGlite (local PostgreSQL-compatible database)
- JWT bearer-token authentication

## Run

```powershell
npm run dev
```

- Web: `http://localhost:5173` (Vite may use a nearby port if occupied)
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

No database service is required. Data persists locally in the directory configured by
`PGLITE_DATA_DIR` (the supplied local setup uses `backend/.devnest-data-v2`).

## Environment variables

`PORT`, `CLIENT_URL`, `JWT_SECRET`, `PGLITE_DATA_DIR`.

## Ranking

`score = likes - dislikes + (comment_count * 2)`. Higher score ranks first; tied scores use newest post first.

## Verification

```powershell
cd backend
npm test
```

The focused tests verify the required ranking formula. The app is also checked with a TypeScript backend compile and a production Vite build.

## Current scope and limitations

Core auth, profiles, posts, threaded replies, likes/dislikes, ranking, Swagger, and responsive UI are implemented. Refresh tokens, post pagination/search, moderation, and production deployment hardening are intentionally outside this assignment scope.

See [AI_USAGE.md](AI_USAGE.md) for the AI workflow review notes.
