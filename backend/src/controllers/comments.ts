import { Request, Response } from "express";
import { db } from "../db/index.js";
import { comments } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const getAllComments = async (req: Request, res: Response) => {
  const result = await db.select().from(comments);
  console.log("comments", result);
  res.status(200).json(result);
};

export const postComment = async (req: Request, res: Response) => {
  const { user_id, post_id, content } = req.body;
  const result = await db
    .insert(comments)
    .values({ user_id, post_id, content })
    .returning();

  res.status(201).json(result[0]);
};

export const editComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // then update the comment
    const result = await db
      .update(comments)
      .set({ content })
      .where(eq(comments.id, parseInt(String(id), 10)))
      .returning();

    res
      .status(201)
      .json({ message: "Comment updated successfully!", comment: result[0] });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.delete(comments).where(eq(comments.id, parseInt(String(id), 10)));

    res.status(200).json({ message: "Comment deleted successfully!" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

