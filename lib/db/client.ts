import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { getServerEnv } from "@/lib/env/server";
import * as schema from "./schema";

const pool = new Pool({ connectionString: getServerEnv().DATABASE_URL });

export const db = drizzle(pool, { schema });
export type Database = typeof db;
