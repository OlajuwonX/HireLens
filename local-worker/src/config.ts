import { z } from "zod";

const flag = z
  .string()
  .optional()
  .transform((value) => ["1", "true", "yes"].includes((value ?? "").toLowerCase()));

const configSchema = z.object({
  HIRELENS_URL: z.url(),
  HIRELENS_WORKER_TOKEN: z.string().startsWith("hlw_", "Paste the token from HireLens Settings > Local worker"),
  BROWSER_CHANNEL: z.enum(["chrome", "msedge"]).default("chrome"),
  AUTO_SUBMIT: flag,
  USE_CLAUDE: flag,
  CONFIRM_TIMEOUT_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  POLL_SECONDS: z.coerce.number().int().min(15).max(3600).default(60),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  EMAIL_POLL_MINUTES: z.coerce.number().int().min(5).max(1440).default(15),
});

export type WorkerConfig = z.infer<typeof configSchema>;

export function readConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const parsed = configSchema.safeParse(env);

  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Worker settings are invalid:\n${problems.join("\n")}`);
  }

  return { ...parsed.data, HIRELENS_URL: parsed.data.HIRELENS_URL.replace(/\/$/, "") };
}
