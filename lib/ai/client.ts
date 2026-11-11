import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { normalizeJsonModelOutput } from "./normalize";
import { applicationIntelligenceSchema } from "./schemas/application-intelligence.schema";
import {
  assertGeneralizedInterviewPool,
  assertValidInterviewPool,
  generatedInterviewPoolSchema,
} from "./schemas/interview-pool.schema";
import { extractedJobResponseSchema } from "./schemas/job-extraction.schema";
import { GeminiApplicationIntelligenceProvider } from "./providers/gemini-application-intelligence-provider";
import { MockApplicationIntelligenceProvider } from "./providers/mock-application-intelligence-provider";
import {
  RetryingApplicationIntelligenceProvider,
  type NamedProvider,
} from "./providers/retrying-application-intelligence-provider";
import type { ApplicationIntelligenceProvider } from "./types";

let provider: ApplicationIntelligenceProvider | undefined;

export function resolveGeminiModels(env: {
  GEMINI_MODEL: string;
  GEMINI_FALLBACK_MODELS?: string;
}) {
  const fallbacks = (env.GEMINI_FALLBACK_MODELS ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set([env.GEMINI_MODEL, ...fallbacks])];
}

function buildGeminiCandidates(
  env: ReturnType<typeof getServerEnv>,
): NamedProvider[] {
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return [];
  }

  return resolveGeminiModels(env).map((model) => ({
    providerName: "gemini",
    model,
    provider: new GeminiApplicationIntelligenceProvider({ apiKey, model }),
  }));
}

export function getApplicationIntelligenceProvider(): ApplicationIntelligenceProvider {
  if (provider) {
    return provider;
  }

  const env = getServerEnv();
  const candidates = buildGeminiCandidates(env);

  provider =
    candidates.length > 0
      ? new RetryingApplicationIntelligenceProvider({
          providers: candidates,
          maxRetries: env.AI_MAX_RETRIES,
          timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
          totalBudgetMs: env.AI_TOTAL_BUDGET_MS,
          extractionTimeoutMs: env.AI_EXTRACTION_TIMEOUT_MS,
          extractionBudgetMs: env.AI_EXTRACTION_BUDGET_MS,
          interviewTimeoutMs: env.AI_INTERVIEW_TIMEOUT_MS,
          interviewBudgetMs: env.AI_INTERVIEW_BUDGET_MS,
          validateAnalysis: (raw) => {
            normalizeJsonModelOutput(raw, applicationIntelligenceSchema);
          },
          validateExtraction: (raw) => {
            normalizeJsonModelOutput(raw, extractedJobResponseSchema);
          },
          validateInterviewPool: (raw) => {
            const pool = normalizeJsonModelOutput(
              raw,
              generatedInterviewPoolSchema,
            );
            assertValidInterviewPool(pool);
            assertGeneralizedInterviewPool(pool);
          },
        })
      : new MockApplicationIntelligenceProvider();

  return provider;
}

export function setApplicationIntelligenceProviderForTests(
  next: ApplicationIntelligenceProvider | undefined,
) {
  provider = next;
}
