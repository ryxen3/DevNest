# DevNest

DevNest is a full-stack developer community platform built for the Agentic Software Engineer Intern assignment.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Express, TypeScript
- Database: PGlite, a local PostgreSQL-compatible database used through Drizzle ORM

## Run locally

```powershell
npm run dev
```

The API runs at `http://localhost:3000`, frontend at `http://localhost:5173`, and Swagger docs at `http://localhost:3000/api/docs`.

The embedded database is created automatically at `backend/.data-devnest`; no remote database setup is needed.

## Environment variables

- `PORT` - API port, default `3000`
- `CLIENT_URL` - frontend origin, default `http://localhost:5173`
- `JWT_SECRET` - token signing secret (use a long random value outside local development)
- `PGLITE_DATA_DIR` - local database storage folder

## Ranking

Posts are ordered by:

`score = likes - dislikes + (comment_count * 2)`

Ties are broken by newest post first.

## Features

- JWT register/login and protected write APIs
- Developer profiles with skills and experiences
- Post creation, ranked feed, detail pages
- Threaded comment replies
- Like/dislike reactions on posts and comments
- Swagger/OpenAPI endpoint
- Shared `{ success, data }` and structured error responses

## Known limitations

This is a local interview assignment build. PGlite data is stored per local checkout, refresh tokens and pagination/search are not implemented, and tests should be expanded before production deployment.

See [AI_USAGE.md](AI_USAGE.md).
