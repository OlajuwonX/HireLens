import "server-only";

import { z } from "zod";

const blankAsUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(
  blankAsUndefined,
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(blankAsUndefined, z.url().optional());

const optionalStringWithDefault = (fallback: string) =>
  z.preprocess(blankAsUndefined, z.string().min(1).default(fallback));

const serverEnvSchema = z.object({
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

const hints: Record<string, string> = {
  DATABASE_URL: "a full Postgres connection string",
  STORAGE_ENDPOINT:
    "a full URL including https://, for example https://<account-id>.r2.cloudflarestorage.com",
};

export function getServerEnv(): ServerEnv {
  if (cached) {
    return cached;
  }

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const key = String(issue.path[0] ?? "unknown");
        const hint = hints[key];

        return `  ${key}: ${issue.message}${hint ? ` — expected ${hint}` : ""}`;
      })
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  cached = result.data;

  return cached;
}
