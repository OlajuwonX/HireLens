import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { GeminiResumeAIProvider } from "./providers/gemini-resume-ai-provider";
import { MockResumeAIProvider } from "./providers/mock-resume-ai-provider";
import type { ResumeAIProvider } from "./types";

let provider: ResumeAIProvider | undefined;

export function getResumeAIProvider(): ResumeAIProvider {
  if (provider) {
    return provider;
  }

  const env = getServerEnv();

  provider = env.GEMINI_API_KEY
    ? new GeminiResumeAIProvider({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
      })
    : new MockResumeAIProvider();

  return provider;
}

export function setResumeAIProviderForTests(next: ResumeAIProvider | undefined) {
  provider = next;
}
