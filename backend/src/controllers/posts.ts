import { Request, Response } from "express";
import { db } from "../db/index.js";
import { comments, posts, users, upvotes } from "../db/schema.js";
import { and, count, desc, eq } from "drizzle-orm";

export const getAllPosts = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        created_at: posts.created_at,
        user_id: users.id,
        username: users.username,
        email: users.email,
        upvotes: count(upvotes.id),
      })
      .from(posts)
      .innerJoin(users, eq(posts.user_id, users.id))
      .leftJoin(upvotes, eq(upvotes.post_id, posts.id))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.created_at))
      .limit(limit)
      .offset(offset);

    const totalCountResult = await db
      .select({
        count: count(),
      })
      .from(posts);

    const totalCount = totalCountResult[0].count;

    console.log("posts", result);
    res.json({ forums: result, totalCount });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(400).json({ message: "Error fetching posts:" });
  }
};

export const insertPost = async (req: Request, res: Response) => {
  const { user_id, title, description } = req.body;
  const result = await db
    .insert(posts)
    .values({ user_id, title, description })
    .returning();

  res.json(result[0]);
};

export const editPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id, title, description } = req.body;

  try {
    const postCreator = await db
      .select()
      .from(posts)
      .where(eq(posts.user_id, user_id));

    if (postCreator.length === 0) {
      console.log("User not found");
      res.status(401).json({ message: "Unauthorized" });
    }
    // then update the post
    const result = await db
      .update(posts)
      .set({ title, description })
      .where(eq(posts.id, parseInt(String(id), 10)))
      .returning();

    res
      .status(201)
      .json({ message: "Post updated succesfully!", post: result[0] });
  } catch (error) {
    console.error("Error editing post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.delete(posts).where(eq(posts.id, parseInt(String(id), 10)));

    res.status(200).json({ message: "Post deleted successfully!" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.query.user_id as string;

  try {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        created_at: posts.created_at,
        user_id: users.id,
        username: users.username,
      })
      .from(posts)
      .innerJoin(users, eq(posts.user_id, users.id))
      .where(eq(posts.id, parseInt(String(id), 10)));

    const commentsWithUsers = await db
      .select({
        id: comments.id,
        content: comments.content,
        created_at: comments.created_at,
        user_id: users.id,
        username: users.username,
        email: users.email,
      })
      .from(comments)
      .innerJoin(users, eq(comments.user_id, users.id))
      .where(eq(comments.post_id, parseInt(String(id), 10)));

    const upvotesCountResult = await db
      .select({ count: count() })
      .from(upvotes)
      .where(eq(upvotes.post_id, parseInt(String(id), 10)));

    const upvotesCount = upvotesCountResult[0]?.count ?? 0;

    let hasUpvoted = false;
    if (userId) {
      const existingUpvote = await db
        .select()
        .from(upvotes)
        .where(
          and(
            eq(upvotes.post_id, parseInt(String(id), 10)),
            eq(upvotes.user_id, parseInt(userId)),
          ),
        );

      hasUpvoted = existingUpvote.length > 0;
    }

    console.log("post", result, commentsWithUsers, upvotesCount, hasUpvoted);

    res.json({
      post: result[0],
      comments: commentsWithUsers,
      upvotesCount,
      hasUpvoted,
    });
  } catch (error) {
    console.error("Error getting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
