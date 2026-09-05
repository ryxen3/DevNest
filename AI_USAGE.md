# AI usage notes

Codex/ChatGPT was used to extract the assignment requirements, scaffold focused backend/frontend changes, and help diagnose local runtime issues. I reviewed generated code before keeping it, including API boundaries, response shapes, schema relations, and frontend build output.

A key issue caught during review was accepting `user_id` directly from client requests. That permits impersonation. The revised API derives the authenticated user from a signed bearer token for protected mutations. Another issue was duplicate votes; the reaction model uses a unique user/target relation and updates an existing reaction instead of adding duplicates.

Before an interview, be ready to explain the ranking formula, PGlite local-database choice, JWT flow, and the tradeoff that this compact assignment implementation does not include refresh tokens.
