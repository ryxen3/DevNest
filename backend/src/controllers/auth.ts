import { Request, Response } from "express";
import { db } from "../db/index.js";
import { comments, posts, upvotes, users } from "../db/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

/** Registers a developer and never returns their password hash. */
export const signupUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username?.trim() || !email?.trim() || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail));
    if (existing.length)
      return res.status(409).json({ message: "Email is already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(users)
      .values({
        username: username.trim(),
        email: normalizedEmail,
        password: passwordHash,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        created_at: users.created_at,
      });
    return res.status(201).json({ message: "Account created", user: created });
  } catch (error) {
    console.error("Signup failed:", error);
    return res
      .status(500)
      .json({
        message:
          "Could not create account. Check that PostgreSQL is running and migrated.",
      });
  }
};

/** Validates credentials. Token issuance can be added without exposing password data. */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    const [account] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()));
    if (!account || !(await bcrypt.compare(password, account.password)))
      return res.status(401).json({ message: "Invalid email or password" });
    return res
      .status(200)
      .json({
        message: "Logged in successfully",
        user: {
          id: account.id,
          username: account.username,
          email: account.email,
        },
      });
  } catch (error) {
    console.error("Login failed:", error);
    return res
      .status(500)
      .json({
        message:
          "Could not log in. Check that PostgreSQL is running and migrated.",
      });
  }
};

/** Never expose this route publicly in production; it intentionally omits password hashes. */
export const getAllUsers = async (_req: Request, res: Response) => {
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      created_at: users.created_at,
    })
    .from(users);
  return res.json(result);
};

export const getHistory = async (req: Request, res: Response) => {
  const userId = Number(req.query.user_id);
  if (!Number.isInteger(userId) || userId <= 0)
    return res.status(400).json({ message: "A valid user_id is required" });
  try {
    const userPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        created_at: posts.created_at,
      })
      .from(posts)
      .where(eq(posts.user_id, userId));
    const userComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        created_at: comments.created_at,
      })
      .from(comments)
      .where(eq(comments.user_id, userId));
    const userUpvotes = await db
      .select({ id: upvotes.id, created_at: upvotes.created_at })
      .from(upvotes)
      .where(eq(upvotes.user_id, userId));
    const history = [
      ...userPosts.map((x) => ({ ...x, type: "post" })),
      ...userComments.map((x) => ({ ...x, type: "comment" })),
      ...userUpvotes.map((x) => ({ ...x, type: "upvote" })),
    ].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return res.json({ history });
  } catch (error) {
    console.error("History failed:", error);
    return res.status(500).json({ message: "Could not load history" });
  }
};
