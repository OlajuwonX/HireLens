import { getServerEnv } from "@/lib/env/server";

export function getConfiguredModel() {
  const env = getServerEnv();

  return env.AI_PRIMARY_MODEL || env.GEMINI_MODEL;
}

export function hasProviderCredentials() {
  const env = getServerEnv();

  return Boolean(env.OPENROUTER_API_KEY || env.GEMINI_API_KEY);
}
