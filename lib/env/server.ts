import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().default("postgres://user:password@localhost:5432/hirelens"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}
