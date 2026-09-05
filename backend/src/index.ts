import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.js";
import communityRoutes from "./routes/community.js";
import { ok, fail } from "./auth.js";
import { closeDatabase } from "./db/index.js";
const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:517[3-9]$/.test(origin))
        return callback(null, true);
      callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(express.json());
app.get("/health", (_, res) => ok(res, { status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/developers", authRoutes);
app.use("/api", communityRoutes);
const spec = {
  openapi: "3.0.0",
  info: {
    title: "DevNest API",
    version: "1.0.0",
    description:
      "Developer community API. Responses use `{ success, message, data }`; errors use `{ success: false, message }`.",
  },
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      AuthRequest: {
        type: "object",
        required: ["email", "password"],
        properties: { email: { type: "string", format: "email" }, password: { type: "string", minLength: 6 }, username: { type: "string" } },
      },
      PostInput: {
        type: "object",
        required: ["title", "description"],
        properties: { title: { type: "string", maxLength: 255 }, description: { type: "string", maxLength: 5000 } },
      },
      CommentInput: {
        type: "object",
        required: ["content"],
        properties: { content: { type: "string", maxLength: 2000 }, parentId: { type: "integer", nullable: true } },
      },
      ReactionInput: {
        type: "object",
        required: ["type"],
        properties: { type: { type: "string", enum: ["like", "dislike"] } },
      },
    },
  },
  paths: {
    "/api/auth/signup": { post: { summary: "Register developer", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRequest" } } } }, responses: { 200: { description: "Account and JWT" }, 400: { description: "Validation error" }, 409: { description: "Email already registered" } } } },
    "/api/auth/login": { post: { summary: "Login developer", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRequest" } } } }, responses: { 200: { description: "Account and JWT" }, 401: { description: "Invalid credentials" } } } },
    "/api/auth/me": { get: { summary: "Current developer", security: [{ bearerAuth: [] }], responses: { 200: { description: "Current profile" } } }, put: { summary: "Update current profile", security: [{ bearerAuth: [] }], responses: { 200: { description: "Updated profile" } } } },
    "/api/developers/{id}": { get: { summary: "Public developer profile", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Developer profile" } } } },
    "/api/posts": {
      get: { summary: "Ranked feed", description: "Ranking: likes − dislikes + (comment count × 2)." },
      post: { summary: "Create post", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PostInput" } } } } },
    },
    "/api/posts/{id}": { get: { summary: "Post detail" }, put: { summary: "Edit own post", security: [{ bearerAuth: [] }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/PostInput" } } } } }, delete: { summary: "Delete own post", security: [{ bearerAuth: [] }] } },
    "/api/posts/{id}/comments": { post: { summary: "Comment or reply", security: [{ bearerAuth: [] }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CommentInput" } } } } } },
    "/api/comments/{id}": { put: { summary: "Edit own comment", security: [{ bearerAuth: [] }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CommentInput" } } } } }, delete: { summary: "Delete own comment", security: [{ bearerAuth: [] }] } },
    "/api/reactions/{type}/{id}": {
      put: { summary: "Like or dislike a post/comment; repeat the same action to remove it", security: [{ bearerAuth: [] }], parameters: [{ name: "type", in: "path", required: true, schema: { type: "string", enum: ["post", "comment"] } }, { name: "id", in: "path", required: true, schema: { type: "integer" } }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ReactionInput" } } } } },
    },
  },
};
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));
app.use((error: any, _req: any, res: any, _next: any) => {
  console.error(error);
  fail(res, 500, "Unexpected server error");
});
app.listen(Number(process.env.PORT) || 3000, () =>
  console.log(`DevNest API on ${process.env.PORT || 3000}`),
);
const shutdown = async () => {
  await closeDatabase();
  process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
