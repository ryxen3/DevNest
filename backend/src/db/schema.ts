import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
  unique,
} from "drizzle-orm/pg-core";
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  skills: text("skills").notNull().default("[]"),
  experiences: text("experiences").notNull().default("[]"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const posts = pgTable("posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("content", { length: 5000 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const comments = pgTable("comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  post_id: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  parent_id: integer("parent_id"),
  content: varchar("content", { length: 2000 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const reactions = pgTable(
  "reactions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id),
    target_type: varchar("target_type", { length: 10 }).notNull(),
    target_id: integer("target_id").notNull(),
    type: varchar("type", { length: 10 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.user_id, t.target_type, t.target_id)],
);
