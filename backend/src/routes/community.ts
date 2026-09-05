import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { comments, posts, reactions, users } from "../db/schema.js";
import { auth, optionalAuth, AuthRequest, fail, ok } from "../auth.js";
const r = Router();
export const rankScore = (
  likes: number,
  dislikes: number,
  commentCount: number,
) => likes - dislikes + commentCount * 2;

const validId = (value: unknown) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

const validPostInput = (title: unknown, description: unknown) =>
  typeof title === "string" &&
  typeof description === "string" &&
  title.trim().length > 0 &&
  title.trim().length <= 255 &&
  description.trim().length > 0 &&
  description.trim().length <= 5000;
const count = async (type: string, id: number) => {
  const rows = await db
    .select()
    .from(reactions)
    .where(and(eq(reactions.target_type, type), eq(reactions.target_id, id)));
  return {
    likes: rows.filter((x) => x.type === "like").length,
    dislikes: rows.filter((x) => x.type === "dislike").length,
  };
};
const myReaction = async (
  userId: number | undefined,
  type: string,
  id: number,
) => {
  if (!userId) return null;
  const [r] = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.user_id, userId),
        eq(reactions.target_type, type),
        eq(reactions.target_id, id),
      ),
    );
  return r?.type ?? null;
};
r.get("/posts", optionalAuth, async (req: AuthRequest, res) => {
  const records = await db.select().from(posts);
  const output = await Promise.all(
    records.map(async (p) => {
      const reactions = await count("post", p.id);
      const commentsCount = (
        await db.select().from(comments).where(eq(comments.post_id, p.id))
      ).length;
      const [u] = await db.select().from(users).where(eq(users.id, p.user_id));
      return {
        ...p,
        author: { id: u.id, username: u.username },
        reactions,
        commentCount: commentsCount,
        score: rankScore(reactions.likes, reactions.dislikes, commentsCount),
        myReaction: await myReaction(req.user?.id, "post", p.id),
      };
    }),
  );
  output.sort(
    (a, b) =>
      b.score - a.score || b.created_at.getTime() - a.created_at.getTime(),
  );
  ok(res, output);
});
r.post("/posts", auth, async (req: AuthRequest, res) => {
  const { title, description } = req.body;
  if (!validPostInput(title, description))
    return fail(res, 400, "Title (1–255) and description (1–5000) are required");
  const [p] = await db
    .insert(posts)
    .values({
      user_id: req.user!.id,
      title: title.trim(),
      description: description.trim(),
    })
    .returning();
  ok(res, p, "Post created");
});
r.put("/posts/:id", auth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id),
    { title, description } = req.body;
  if (!validId(id)) return fail(res, 400, "Invalid post id");
  if (!validPostInput(title, description))
    return fail(res, 400, "Title (1–255) and description (1–5000) are required");
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return fail(res, 404, "Post not found");
  if (p.user_id !== req.user!.id)
    return fail(res, 403, "You can only edit your own posts");
  const [updated] = await db
    .update(posts)
    .set({ title: title.trim(), description: description.trim() })
    .where(eq(posts.id, id))
    .returning();
  ok(res, updated, "Post updated");
});
r.delete("/posts/:id", auth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!validId(id)) return fail(res, 400, "Invalid post id");
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return fail(res, 404, "Post not found");
  if (p.user_id !== req.user!.id)
    return fail(res, 403, "You can only delete your own posts");
  await db.delete(posts).where(eq(posts.id, id));
  ok(res, { id }, "Post deleted");
});
r.get("/posts/:id", optionalAuth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!validId(id)) return fail(res, 400, "Invalid post id");
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return fail(res, 404, "Post not found");
  const [u] = await db.select().from(users).where(eq(users.id, p.user_id));
  const rows = await db.select().from(comments).where(eq(comments.post_id, id));
  const items = await Promise.all(
    rows.map(async (c) => {
      const [a] = await db.select().from(users).where(eq(users.id, c.user_id));
      return {
        ...c,
        author: { id: a.id, username: a.username },
        reactions: await count("comment", c.id),
        myReaction: await myReaction(req.user?.id, "comment", c.id),
        replies: [] as any[],
      };
    }),
  );
  const map = new Map(items.map((x) => [x.id, x]));
  items.forEach((x) => x.parent_id && map.get(x.parent_id)?.replies.push(x));
  ok(res, {
    ...p,
    author: { id: u.id, username: u.username },
    reactions: await count("post", id),
    myReaction: await myReaction(req.user?.id, "post", id),
    comments: items.filter((x) => !x.parent_id),
  });
});
r.post("/posts/:id/comments", auth, async (req: AuthRequest, res) => {
  const postId = Number(req.params.id),
    { content, parentId = null } = req.body;
  if (!validId(postId)) return fail(res, 400, "Invalid post id");
  if (typeof content !== "string" || !content.trim() || content.trim().length > 2000)
    return fail(res, 400, "Comment content must be between 1 and 2000 characters");
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return fail(res, 404, "Post not found");
  if (parentId) {
    if (!validId(parentId)) return fail(res, 400, "Invalid parent comment");
    const [parent] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, Number(parentId)));
    if (!parent || parent.post_id !== postId)
      return fail(res, 400, "Invalid parent comment");
  }
  const [c] = await db
    .insert(comments)
    .values({
      post_id: postId,
      user_id: req.user!.id,
      parent_id: parentId ? Number(parentId) : null,
      content: content.trim(),
    })
    .returning();
  ok(res, c, "Comment created");
});
r.put("/comments/:id", auth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { content } = req.body;
  if (!validId(id)) return fail(res, 400, "Invalid comment id");
  if (typeof content !== "string" || !content.trim() || content.trim().length > 2000)
    return fail(res, 400, "Comment content must be between 1 and 2000 characters");
  const [comment] = await db.select().from(comments).where(eq(comments.id, id));
  if (!comment) return fail(res, 404, "Comment not found");
  if (comment.user_id !== req.user!.id)
    return fail(res, 403, "You can only edit your own comments");
  const [updated] = await db
    .update(comments)
    .set({ content: content.trim() })
    .where(eq(comments.id, id))
    .returning();
  ok(res, updated, "Comment updated");
});
r.delete("/comments/:id", auth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!validId(id)) return fail(res, 400, "Invalid comment id");
  const [comment] = await db.select().from(comments).where(eq(comments.id, id));
  if (!comment) return fail(res, 404, "Comment not found");
  if (comment.user_id !== req.user!.id)
    return fail(res, 403, "You can only delete your own comments");
  await db.delete(comments).where(eq(comments.id, id));
  ok(res, { id }, "Comment deleted");
});
r.put("/reactions/:type/:id", auth, async (req: AuthRequest, res) => {
  const targetType = String(req.params.type),
    targetId = Number(req.params.id),
    type = req.body.type;
  if (
    !["post", "comment"].includes(targetType) ||
    !["like", "dislike"].includes(type) ||
    !validId(targetId)
  )
    return fail(res, 400, "Invalid reaction");
  const target =
    targetType === "post"
      ? await db.select().from(posts).where(eq(posts.id, targetId))
      : await db.select().from(comments).where(eq(comments.id, targetId));
  if (!target[0]) return fail(res, 404, `${targetType} not found`);
  const existing = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.user_id, req.user!.id),
        eq(reactions.target_type, targetType),
        eq(reactions.target_id, targetId),
      ),
    );
  let myReaction: string | null = type;
  if (existing[0]) {
    if (String(existing[0].type) === String(type)) {
      await db.delete(reactions).where(eq(reactions.id, existing[0].id));
      myReaction = null;
    } else
      await db
        .update(reactions)
        .set({ type })
        .where(eq(reactions.id, existing[0].id));
  } else
    await db
      .insert(reactions)
      .values({
        user_id: req.user!.id,
        target_type: targetType,
        target_id: targetId,
        type,
      });
  ok(res, { reactions: await count(targetType, targetId), myReaction });
});
export default r;
