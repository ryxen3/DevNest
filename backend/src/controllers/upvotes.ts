import { Request, Response } from "express";
import { db } from "../db/index.js";
import { upvotes } from "../db/schema.js";
import { and, count, eq } from "drizzle-orm";

const getCount = async (postId: number) => {
  const [result] = await db
    .select({ total: count() })
    .from(upvotes)
    .where(eq(upvotes.post_id, postId));
  return Number(result?.total ?? 0);
};

/** Adds one vote per developer; post authors are allowed to support their own work. */
export const addUpvote = async (req: Request, res: Response) => {
  const postId = Number(req.body.post_id),
    userId = Number(req.body.user_id);
  if (!Number.isInteger(postId) || !Number.isInteger(userId))
    return res
      .status(400)
      .json({ message: "post_id and user_id are required" });
  try {
    await db
      .insert(upvotes)
      .values({ post_id: postId, user_id: userId })
      .onConflictDoNothing();
    return res
      .status(200)
      .json({
        message: "Upvote saved",
        upvotesCount: await getCount(postId),
        hasUpvoted: true,
      });
  } catch (error) {
    console.error("Upvote failed:", error);
    return res.status(500).json({ message: "Failed to save upvote" });
  }
};

export const getUpvote = async (_req: Request, res: Response) => {
  try {
    return res.json({ upvotes: await db.select().from(upvotes) });
  } catch {
    return res.status(500).json({ message: "Could not load upvotes" });
  }
};

export const removeUpvote = async (req: Request, res: Response) => {
  const postId = Number(req.body.post_id),
    userId = Number(req.body.user_id);
  if (!Number.isInteger(postId) || !Number.isInteger(userId))
    return res
      .status(400)
      .json({ message: "post_id and user_id are required" });
  try {
    await db
      .delete(upvotes)
      .where(and(eq(upvotes.post_id, postId), eq(upvotes.user_id, userId)));
    return res.json({
      message: "Upvote removed",
      upvotesCount: await getCount(postId),
      hasUpvoted: false,
    });
  } catch (error) {
    console.error("Unvote failed:", error);
    return res.status(500).json({ message: "Failed to remove upvote" });
  }
};
