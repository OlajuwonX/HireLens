import "server-only";

import { z } from "zod";

const blankAsUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const stripWrappingQuotes = (value: string) =>
  value.replace(/^['"]|['"]$/g, "");

const optionalString = z.preprocess(
  (value) =>
    typeof value === "string"
      ? blankAsUndefined(stripWrappingQuotes(value.trim()))
      : blankAsUndefined(value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string"
      ? blankAsUndefined(stripWrappingQuotes(value.trim()))
      : blankAsUndefined(value),
  z.url().optional(),
);

const requiredUrl = z.preprocess(
  (value) =>
    typeof value === "string" ? stripWrappingQuotes(value.trim()) : value,
  z.url(),
);

const optionalStorageEndpoint = z.preprocess((value) => {
  if (typeof value !== "string") {
    return blankAsUndefined(value);
  }

  const normalized = stripWrappingQuotes(value.trim());

  if (!normalized) {
    return undefined;
  }

  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(normalized)
    ? normalized
    : `https://${normalized}`;
}, z.url().optional());

const optionalStringWithDefault = (fallback: string) =>
  z.preprocess(
    (value) =>
      typeof value === "string"
        ? blankAsUndefined(stripWrappingQuotes(value.trim()))
        : blankAsUndefined(value),
    z.string().min(1).default(fallback),
  );

const optionalIntWithDefault = (fallback: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string"
        ? blankAsUndefined(stripWrappingQuotes(value.trim()))
        : blankAsUndefined(value),
    z.coerce.number().int().positive().default(fallback),
  );

const optionalBooleanWithDefault = (fallback: boolean) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value ?? fallback;
    }

    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return fallback;
    }

    return ["1", "true", "yes", "on"].includes(normalized);
  }, z.boolean().default(fallback));

const serverEnvSchema = z.object({
  AUTH_GOOGLE_ID: optionalString,
  AUTH_GOOGLE_SECRET: optionalString,
  AUTH_SECRET: optionalString,
  DATABASE_URL: requiredUrl,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: optionalStringWithDefault("gemini-3.5-flash-lite"),

  AI_DAILY_APPLICATION_ANALYSIS_LIMIT: optionalIntWithDefault(3),
  AI_DAILY_REGENERATE_LIMIT: optionalIntWithDefault(1),
  AI_DAILY_JOB_EXTRACTION_LIMIT: optionalIntWithDefault(10),
  AI_GLOBAL_DAILY_SAFETY_LIMIT: optionalIntWithDefault(18),

  STORAGE_PROVIDER: z.enum(["backblaze"]).default("backblaze"),
  STORAGE_BUCKET: optionalString,
  STORAGE_REGION: optionalStringWithDefault("us-west-004"),
  STORAGE_ENDPOINT: optionalStorageEndpoint,
  STORAGE_ACCESS_KEY_ID: optionalString,
  STORAGE_SECRET_ACCESS_KEY: optionalString,
  STORAGE_FORCE_PATH_STYLE: optionalBooleanWithDefault(false),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

const hints: Record<string, string> = {
  DATABASE_URL: "a full Postgres connection string",
  STORAGE_ENDPOINT:
    "a full Backblaze S3-compatible endpoint URL, for example https://s3.us-west-004.backblazeb2.com",
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
