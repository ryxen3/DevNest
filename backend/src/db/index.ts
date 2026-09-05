import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema.js";
const client = new PGlite(process.env.PGLITE_DATA_DIR || "./.data-devnest");
await client.exec(
  `CREATE TABLE IF NOT EXISTS users(id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,username VARCHAR(255) NOT NULL,email VARCHAR(255) NOT NULL UNIQUE,password VARCHAR(255) NOT NULL,skills TEXT NOT NULL DEFAULT '[]',experiences TEXT NOT NULL DEFAULT '[]',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS posts(id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),title VARCHAR(255) NOT NULL,content VARCHAR(5000) NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS comments(id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,user_id INTEGER NOT NULL REFERENCES users(id),parent_id INTEGER,content VARCHAR(2000) NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS reactions(id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),target_type VARCHAR(10) NOT NULL,target_id INTEGER NOT NULL,type VARCHAR(10) NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(user_id,target_type,target_id));`,
);
export const db = drizzle(client, { schema });
export const closeDatabase = () => client.close();
