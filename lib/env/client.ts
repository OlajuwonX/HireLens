import { z } from "zod";

const clientEnvSchema = z.object({});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({});
}
