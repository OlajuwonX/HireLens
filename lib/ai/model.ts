import { getServerEnv } from "@/lib/env/server";

export function getConfiguredModel() {
  const env = getServerEnv();

  return env.GEMINI_MODEL;
}

export function hasProviderCredentials() {
  const env = getServerEnv();

  return Boolean(env.GEMINI_API_KEY);
}
