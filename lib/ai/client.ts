import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { normalizeJsonModelOutput } from "./normalize";
import { applicationIntelligenceSchema } from "./schemas/application-intelligence.schema";
import { extractedJobResponseSchema } from "./schemas/job-extraction.schema";
import { GeminiApplicationIntelligenceProvider } from "./providers/gemini-application-intelligence-provider";
import { MockApplicationIntelligenceProvider } from "./providers/mock-application-intelligence-provider";
import { OpenRouterApplicationIntelligenceProvider } from "./providers/openrouter-application-intelligence-provider";
import {
  RetryingApplicationIntelligenceProvider,
  type NamedProvider,
} from "./providers/retrying-application-intelligence-provider";
import type { ApplicationIntelligenceProvider } from "./types";

let provider: ApplicationIntelligenceProvider | undefined;

export const DEFAULT_OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "z-ai/glm-5.2:free",
];

function splitModels(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function resolveOpenRouterModels(env: {
  AI_PRIMARY_MODEL?: string;
  AI_FALLBACK_MODELS?: string;
}) {
  const configured = [
    ...splitModels(env.AI_PRIMARY_MODEL),
    ...splitModels(env.AI_FALLBACK_MODELS),
  ];

  return configured.length > 0 ? configured : DEFAULT_OPENROUTER_MODELS;
}

function buildOpenRouterCandidates(
  env: ReturnType<typeof getServerEnv>,
): NamedProvider[] {
  if (!env.OPENROUTER_API_KEY) {
    return [];
  }

  const apiKey = env.OPENROUTER_API_KEY;

  return resolveOpenRouterModels(env).map((model) => ({
    providerName: "openrouter",
    model,
    provider: new OpenRouterApplicationIntelligenceProvider({
      apiKey,
      model,
      timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
      maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
      allowDataCollection: env.AI_ALLOW_DATA_COLLECTION,
      siteUrl: env.SITE_URL,
      appName: "HireLens",
    }),
  }));
}

function buildGeminiCandidates(
  env: ReturnType<typeof getServerEnv>,
): NamedProvider[] {
  if (!env.GEMINI_API_KEY) {
    return [];
  }

  return [
    {
      providerName: "gemini",
      model: env.GEMINI_MODEL,
      provider: new GeminiApplicationIntelligenceProvider({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
      }),
    },
  ];
}

export function resolveProviderOrder(value: string | undefined) {
  const order = (value ?? "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name === "gemini" || name === "openrouter");

  return order.length > 0 ? [...new Set(order)] : ["gemini", "openrouter"];
}

export function getApplicationIntelligenceProvider(): ApplicationIntelligenceProvider {
  if (provider) {
    return provider;
  }

  const env = getServerEnv();
  const byName: Record<string, NamedProvider[]> = {
    openrouter: buildOpenRouterCandidates(env),
    gemini: buildGeminiCandidates(env),
  };

  const candidates = resolveProviderOrder(env.AI_PROVIDER_ORDER).flatMap(
    (name) => byName[name] ?? [],
  );

  provider =
    candidates.length > 0
      ? new RetryingApplicationIntelligenceProvider({
          providers: candidates,
          maxRetries: env.AI_MAX_RETRIES,
          timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
          totalBudgetMs: env.AI_TOTAL_BUDGET_MS,
          extractionTimeoutMs: env.AI_EXTRACTION_TIMEOUT_MS,
          extractionBudgetMs: env.AI_EXTRACTION_BUDGET_MS,
          validateAnalysis: (raw) => {
            normalizeJsonModelOutput(raw, applicationIntelligenceSchema);
          },
          validateExtraction: (raw) => {
            normalizeJsonModelOutput(raw, extractedJobResponseSchema);
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
