import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getServerEnv } from "@/lib/env/server";
import * as schema from "./schema";

const sql = neon(getServerEnv().DATABASE_URL);

export const db = drizzle(sql, { schema });
export type Database = typeof db;
