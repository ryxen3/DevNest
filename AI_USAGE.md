# AI Usage and Engineering Workflow

## Project overview

I built **DevNest** as a compact full-stack developer community application for the Agentic Software Engineer Intern assignment. The goal was to deliver the required community features in a codebase that is easy to explain, run locally, and extend during an interview: authentication, developer profiles, posts, threaded discussions, likes/dislikes, ranked feeds, API documentation, and a polished responsive interface.

I chose a deliberately small architecture:

- **Frontend:** React, TypeScript, and Vite.
- **Backend:** Express and TypeScript.
- **Data:** Drizzle ORM with PGlite, a local PostgreSQL-compatible database.
- **Authentication:** signed JWT bearer tokens.

This avoided requiring a hosted database or external credentials for a reviewer to run the project, while still preserving relational tables and PostgreSQL-style database behaviour.

## How I used AI assistance

I used Codex/ChatGPT as an engineering assistant, not as an unchecked code generator. It helped me extract the assignment requirements, investigate runtime errors, propose small implementation steps, and speed up repetitive refactoring. I reviewed the resulting code, made implementation choices, tested the application locally, and kept the scope intentionally simple.

The most useful AI-assisted work was:

- turning the assignment brief into a concrete requirements checklist;
- finding the cause of dependency, port, CORS, and local database startup failures;
- restructuring the original forum project into a focused DevNest implementation;
- checking API boundary cases such as impersonation, duplicate reactions, invalid parent comments, and ownership checks;
- compiling the TypeScript backend, creating a production Vite build, and running the focused ranking tests.

## Requirements translated into implementation

I first converted the brief into implementation areas instead of adding features blindly:

| Assignment area | DevNest implementation |
| --- | --- |
| Authentication | JWT signup/login; the server derives the active user from the token. |
| Developer profiles | Skills and experience fields, profile editing, and public developer profile views. |
| Community posts | Authenticated create, edit, delete, feed, and post-detail flows. |
| Discussions | Comments with parent references and recursive nested replies. |
| Reactions | One like or dislike per user on either a post or a comment; repeat-click removes the same reaction. |
| Ranking | `likes - dislikes + (comment_count * 2)`, ordered highest first. |
| API quality | Consistent success/error envelopes, input checks, protected mutations, and Swagger UI. |
| Presentation | Responsive React UI with loading, empty, ownership, and error states. |

## Significant issues I encountered and resolved

### Incorrect backend entry point and stale development processes

The original scripts were starting an outdated compiled entry point (`dist/src/index.js`) while the corrected TypeScript build produced `dist/index.js`. This created a confusing situation where a server could be running but not contain the latest routes or CORS fix.

I corrected the backend package scripts, identified stale Node, nodemon, and TypeScript-watch processes, and restarted only the relevant DevNest backend process. I then verified the actual active server using the `/health`, `/api/posts`, and `/api/docs` endpoints.

### PGlite local database locks after interrupted restarts

During repeated development restarts, an older server process held the PGlite data directory open. That caused PGlite to abort before Express could bind to port `3000`.

I diagnosed this as a stale DevNest backend process rather than a frontend fault. To protect existing work, I preserved the original data directory, configured a fresh persistent local directory for the final setup, and added graceful `SIGINT`/`SIGTERM` database shutdown handling. This is especially important when Vite or nodemon restarts a project during development.

### Insecure client-supplied user IDs

The early data flow accepted a user identifier from the browser on mutation requests. That would allow a malicious client to create content or reactions on behalf of another user simply by changing a request payload.

I replaced this approach with JWT bearer authentication. Protected routes read the verified user ID from the token on the server. Post and comment edit/delete endpoints also check ownership before changing data. This makes the authorization decision server-side, where it belongs.

### Reactions not reflecting correctly after switching accounts

The reaction buttons originally kept local component state after account changes. As a result, an account could initially see stale counts or its prior selection until clicking a reaction.

I fixed this by returning the current user’s reaction state with feed and post-detail API responses, then synchronising the reaction component state whenever the post/comment or selected reaction changes. The same like/dislike action now toggles off, while choosing the opposite action replaces the existing reaction.

### Missing assignment functionality in the original forum code

The starting application had basic posts and comments, but it did not fully satisfy the brief. I added developer profiles, nested replies, generic reactions for posts and comments, dislike support, ranking, JWT protection, Swagger documentation, validation, response envelopes, owner controls, and assignment documentation.

## Key technical decisions

### Authentication and authorization

Passwords are hashed with `bcryptjs`. Signup and login return a signed JWT. The frontend stores the token locally and sends it as an `Authorization: Bearer <token>` header. Authentication middleware verifies it, and protected routes use the authenticated user ID rather than trusting request data.

### Reaction model

Reactions are stored using a generic target type (`post` or `comment`) and target ID. A unique database constraint on `(user_id, target_type, target_id)` guarantees that one user cannot create duplicate reactions on the same target. The API implements predictable toggle behaviour:

1. First like/dislike creates the reaction.
2. Choosing the same reaction again removes it.
3. Choosing the opposite reaction updates it.

### Comment tree

Each comment can store an optional `parent_id`. The API retrieves all comments for a post, builds a map by ID, and attaches children to their parent before returning top-level comments. The frontend renders that recursive reply tree using the same component for every level.

### Feed ranking

The required ranking formula is intentionally visible and testable:

```text
score = likes - dislikes + (comment_count * 2)
```

Posts are then sorted by score descending, with the newest post winning any tie. The focused Node test suite verifies representative cases for comment weighting and dislike penalties.

## Verification performed

Before considering the work ready, I verified:

- backend TypeScript compilation;
- frontend TypeScript compilation and production Vite build;
- focused ranking tests (`npm test` inside `backend`);
- API health response at `/health`;
- feed response at `/api/posts`;
- Swagger UI availability at `/api/docs`.

## Scope and honest limitations

DevNest is designed as a readable assignment project, not as a complete production social platform. The core brief is implemented, but the following are intentional next steps rather than hidden omissions:

- no refresh-token rotation or password-reset flow;
- no pagination, full-text search, notifications, or moderation workflow;
- focused unit tests rather than a comprehensive HTTP integration suite;
- a local PGlite data store instead of hosted deployment infrastructure;
- simple browser prompts for some reply/comment editing interactions, which could later become inline forms or modals.

For an interview, I would explain these trade-offs directly: I prioritised correct authorization, the required data relationships, a runnable local setup, and a clean demonstrable user flow before adding larger platform features.
