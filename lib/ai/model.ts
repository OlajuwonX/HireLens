import { getServerEnv } from "@/lib/env/server";

export function getConfiguredModel() {
  return getServerEnv().GEMINI_MODEL;
}

export function hasProviderCredentials() {
  return Boolean(getServerEnv().GEMINI_API_KEY);
}
