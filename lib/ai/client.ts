import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { GeminiApplicationIntelligenceProvider } from "./providers/gemini-application-intelligence-provider";
import { MockApplicationIntelligenceProvider } from "./providers/mock-application-intelligence-provider";
import { OpenRouterApplicationIntelligenceProvider } from "./providers/openrouter-application-intelligence-provider";
import {
  RetryingApplicationIntelligenceProvider,
  type NamedProvider,
} from "./providers/retrying-application-intelligence-provider";
import type { ApplicationIntelligenceProvider } from "./types";

let provider: ApplicationIntelligenceProvider | undefined;

const DEFAULT_OPENROUTER_MODELS = [
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-235b-a22b:free",
  "nvidia/nemotron-nano-9b-v2:free",
];

function splitModels(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function isModel(value: string | undefined): value is string {
  return Boolean(value);
}

export function getApplicationIntelligenceProvider(): ApplicationIntelligenceProvider {
  if (provider) {
    return provider;
  }

  const env = getServerEnv();
  const candidates: NamedProvider[] = [];

  if (env.OPENROUTER_API_KEY) {
    const models = [
      env.AI_PRIMARY_MODEL,
      ...splitModels(env.AI_FALLBACK_MODELS),
    ].filter(isModel);
    const configuredModels = models.length > 0 ? models : DEFAULT_OPENROUTER_MODELS;

    candidates.push(
      ...configuredModels.map((model) => ({
        providerName: "openrouter",
        model,
        provider: new OpenRouterApplicationIntelligenceProvider({
          apiKey: env.OPENROUTER_API_KEY!,
          model,
          timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
          siteUrl: env.SITE_URL,
          appName: "HireLens",
        }),
      })),
    );
  }

  if (env.GEMINI_API_KEY) {
    candidates.push({
      providerName: "gemini",
      model: env.GEMINI_MODEL,
      provider: new GeminiApplicationIntelligenceProvider({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
      }),
    });
  }

  provider =
    candidates.length > 0
      ? new RetryingApplicationIntelligenceProvider({
          providers: candidates,
          maxRetries: env.AI_MAX_RETRIES,
          timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
        })
      : new MockApplicationIntelligenceProvider();

  return provider;
}

export function setApplicationIntelligenceProviderForTests(
  next: ApplicationIntelligenceProvider | undefined,
) {
  provider = next;
}
