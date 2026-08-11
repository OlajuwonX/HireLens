import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { GeminiApplicationIntelligenceProvider } from "./providers/gemini-application-intelligence-provider";
import { MockApplicationIntelligenceProvider } from "./providers/mock-application-intelligence-provider";
import type { ApplicationIntelligenceProvider } from "./types";

let provider: ApplicationIntelligenceProvider | undefined;

export function getApplicationIntelligenceProvider(): ApplicationIntelligenceProvider {
  if (provider) {
    return provider;
  }

  const env = getServerEnv();

  provider = env.GEMINI_API_KEY
    ? new GeminiApplicationIntelligenceProvider({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
      })
    : new MockApplicationIntelligenceProvider();

  return provider;
}

export function setApplicationIntelligenceProviderForTests(
  next: ApplicationIntelligenceProvider | undefined,
) {
  provider = next;
}
