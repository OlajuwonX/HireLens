import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { Pool } from "@neondatabase/serverless";
import * as Sentry from "@sentry/nextjs";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const pool = new Pool({ connectionString: getServerEnv().DATABASE_URL });

pool.on("error", (error: Error) => {
  Sentry.captureException(error, {
    tags: { source: "neon-pool-idle-client" },
  });
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
