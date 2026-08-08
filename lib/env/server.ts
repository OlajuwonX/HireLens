import "server-only";

import { z } from "zod";

const blankAsUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(blankAsUndefined, z.string().min(1).optional());

const optionalUrl = z.preprocess(blankAsUndefined, z.url().optional());

const optionalStringWithDefault = (fallback: string) =>
  z.preprocess(blankAsUndefined, z.string().min(1).default(fallback));

const serverEnvSchema = z
  .object({
    AUTH_GOOGLE_ID: optionalString,
    AUTH_GOOGLE_SECRET: optionalString,
    AUTH_SECRET: optionalString,
    DATABASE_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    GEMINI_API_KEY: optionalString,
    GEMINI_MODEL: optionalStringWithDefault("gemini-2.5-flash"),

    STORAGE_BUCKET: optionalString,
    STORAGE_REGION: optionalStringWithDefault("auto"),
    STORAGE_ENDPOINT: optionalUrl,
    STORAGE_ACCESS_KEY_ID: optionalString,
    STORAGE_SECRET_ACCESS_KEY: optionalString,
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);

  return cached;
}
