import { describe, expect, it, vi } from "vitest";
import { AiProviderChainError, AiProviderError } from "@/lib/ai/provider-errors";
import { RetryingApplicationIntelligenceProvider } from "@/lib/ai/providers/retrying-application-intelligence-provider";
import type { ApplicationIntelligenceProvider } from "@/lib/ai/types";

function provider(
  analyzeApplication: ApplicationIntelligenceProvider["analyzeApplication"],
): ApplicationIntelligenceProvider {
  return {
    analyzeApplication,
    extractJobPosting: vi.fn(),
  };
}

function success(model: string, rawResponse = "{}") {
  return {
    provider: "openrouter" as const,
    model,
    rawResponse,
    durationMs: 10,
  };
}

const input = {
  resume: {
    pdfBytes: new Uint8Array(),
    filename: "resume.pdf",
    text: "Resume text",
  },
  job: {
    title: "Engineer",
    company: "Acme",
    location: null,
    workArrangement: "Remote",
    employmentType: "Full-time",
    deadline: null,
    source: null,
    sourceUrl: null,
    description: "Build things",
    requirements: null,
  },
  priorCorrections: [],
};

describe("RetryingApplicationIntelligenceProvider", () => {
  it("retries transient provider failures before returning success", async () => {
    const analyze = vi
      .fn()
      .mockRejectedValueOnce(
        new AiProviderError("upstream unavailable", {
          provider: "openrouter",
          model: "primary",
          status: 503,
        }),
      )
      .mockResolvedValueOnce(success("primary"));

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        {
          provider: provider(analyze),
          providerName: "openrouter",
          model: "primary",
        },
      ],
      maxRetries: 1,
      timeoutMs: 1_000,
      baseDelayMs: 1,
    });

    await expect(retrying.analyzeApplication(input)).resolves.toMatchObject({
      model: "primary",
    });
    expect(analyze).toHaveBeenCalledTimes(2);
  });

  it("falls back to the next configured provider after retries are exhausted", async () => {
    const failing = vi.fn().mockRejectedValue(
      new AiProviderError("upstream unavailable", {
        provider: "openrouter",
        model: "primary",
        status: 503,
      }),
    );
    const healthy = vi.fn().mockResolvedValue(success("fallback"));

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        {
          provider: provider(failing),
          providerName: "openrouter",
          model: "primary",
        },
        {
          provider: provider(healthy),
          providerName: "gemini",
          model: "fallback",
        },
      ],
      maxRetries: 1,
      timeoutMs: 1_000,
      baseDelayMs: 1,
    });

    await expect(retrying.analyzeApplication(input)).resolves.toMatchObject({
      model: "fallback",
    });
    expect(failing).toHaveBeenCalledTimes(2);
    expect(healthy).toHaveBeenCalledTimes(1);
  });

  it("does not retry permanent provider errors", async () => {
    const analyze = vi.fn().mockRejectedValue(
      new AiProviderError("no such model", {
        provider: "openrouter",
        model: "primary",
        status: 404,
      }),
    );

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        {
          provider: provider(analyze),
          providerName: "openrouter",
          model: "primary",
        },
      ],
      maxRetries: 2,
      timeoutMs: 1_000,
      baseDelayMs: 1,
    });

    await expect(retrying.analyzeApplication(input)).rejects.toBeInstanceOf(
      AiProviderChainError,
    );
    expect(analyze).toHaveBeenCalledTimes(1);
  });

  it("treats a response that fails validation as a reason to fall back", async () => {
    const badOutput = vi.fn().mockResolvedValue(success("primary", "{}"));
    const goodOutput = vi
      .fn()
      .mockResolvedValue(success("fallback", '{"ok":true}'));

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        {
          provider: provider(badOutput),
          providerName: "openrouter",
          model: "primary",
        },
        {
          provider: provider(goodOutput),
          providerName: "gemini",
          model: "fallback",
        },
      ],
      maxRetries: 1,
      timeoutMs: 1_000,
      baseDelayMs: 1,
      validateAnalysis: (raw) => {
        if (raw === "{}") {
          throw new Error("missing required keys");
        }
      },
    });

    await expect(retrying.analyzeApplication(input)).resolves.toMatchObject({
      model: "fallback",
    });
    expect(badOutput).toHaveBeenCalledTimes(1);
  });

  it("stops using a provider that reports a rate limit and moves to the next one", async () => {
    const limited = vi.fn().mockRejectedValue(
      new AiProviderError("daily quota reached", {
        provider: "openrouter",
        model: "primary",
        status: 429,
      }),
    );
    const secondOpenRouterModel = vi.fn().mockResolvedValue(success("second"));
    const gemini = vi.fn().mockResolvedValue(success("gemini-model"));

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        {
          provider: provider(limited),
          providerName: "openrouter",
          model: "primary",
        },
        {
          provider: provider(secondOpenRouterModel),
          providerName: "openrouter",
          model: "second",
        },
        {
          provider: provider(gemini),
          providerName: "gemini",
          model: "gemini-model",
        },
      ],
      maxRetries: 2,
      timeoutMs: 1_000,
      baseDelayMs: 1,
    });

    await expect(retrying.analyzeApplication(input)).resolves.toMatchObject({
      model: "gemini-model",
    });
    expect(limited).toHaveBeenCalledTimes(1);
    expect(secondOpenRouterModel).not.toHaveBeenCalled();
    expect(gemini).toHaveBeenCalledTimes(1);
  });

  it("always leaves the last provider a chance, even when earlier ones stall", async () => {
    const slow = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(success("primary")), 5_000);
        }),
    );
    const rescue = vi.fn().mockResolvedValue(success("gemini-model"));

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        {
          provider: provider(slow),
          providerName: "openrouter",
          model: "primary",
        },
        {
          provider: provider(slow),
          providerName: "openrouter",
          model: "second",
        },
        {
          provider: provider(rescue),
          providerName: "gemini",
          model: "gemini-model",
        },
      ],
      maxRetries: 2,
      timeoutMs: 60,
      totalBudgetMs: 180,
      baseDelayMs: 1,
    });

    await expect(retrying.analyzeApplication(input)).resolves.toMatchObject({
      model: "gemini-model",
    });
    expect(rescue).toHaveBeenCalledTimes(1);
  });

  it("records budget exhaustion when the window closes on a provider", async () => {
    const stall = () =>
      vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(success("never")), 5_000);
          }),
      );
    const rescue = vi.fn().mockResolvedValue(success("gemini-model"));

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        { provider: provider(stall()), providerName: "openrouter", model: "a" },
        { provider: provider(stall()), providerName: "openrouter", model: "b" },
        { provider: provider(stall()), providerName: "openrouter", model: "c" },
        {
          provider: provider(rescue),
          providerName: "gemini",
          model: "gemini-model",
        },
      ],
      maxRetries: 0,
      timeoutMs: 50,
      totalBudgetMs: 120,
      baseDelayMs: 1,
    });

    await expect(retrying.analyzeApplication(input)).resolves.toMatchObject({
      model: "gemini-model",
    });
    expect(rescue).toHaveBeenCalledTimes(1);
  });

  it("does not retry a timeout on the same model", async () => {
    const slow = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(success("primary")), 5_000);
        }),
    );

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        {
          provider: provider(slow),
          providerName: "openrouter",
          model: "primary",
        },
      ],
      maxRetries: 3,
      timeoutMs: 30,
      totalBudgetMs: 500,
      baseDelayMs: 1,
    });

    await retrying.analyzeApplication(input).catch(() => undefined);

    expect(slow).toHaveBeenCalledTimes(1);
  });

  it("reports every attempt so a failure can be diagnosed", async () => {
    const analyze = vi.fn().mockRejectedValue(
      new AiProviderError("upstream unavailable", {
        provider: "openrouter",
        model: "primary",
        status: 503,
        code: "upstream",
      }),
    );

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        {
          provider: provider(analyze),
          providerName: "openrouter",
          model: "primary",
        },
      ],
      maxRetries: 1,
      timeoutMs: 1_000,
      baseDelayMs: 1,
    });

    const error = (await retrying
      .analyzeApplication(input)
      .catch((thrown: unknown) => thrown)) as AiProviderChainError;

    expect(error.attempts).toHaveLength(2);
    expect(error.attempts[0]).toMatchObject({
      provider: "openrouter",
      model: "primary",
      status: 503,
      failureClass: "TRANSIENT",
    });
  });
});
