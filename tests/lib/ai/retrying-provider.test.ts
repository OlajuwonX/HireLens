import { describe, expect, it, vi } from "vitest";
import { AiProviderError } from "@/lib/ai/provider-errors";
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

const input = {
  resume: {
    pdfBase64: "",
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
  it("retries retryable provider failures before returning success", async () => {
    const analyze = vi
      .fn()
      .mockRejectedValueOnce(
        new AiProviderError("rate limited", {
          provider: "openrouter",
          model: "primary",
          status: 429,
        }),
      )
      .mockResolvedValueOnce({
        provider: "openrouter",
        model: "primary",
        rawResponse: "{}",
        durationMs: 10,
      });

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        { provider: provider(analyze), providerName: "openrouter", model: "primary" },
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
    const primary = vi.fn().mockRejectedValue(
      new AiProviderError("unavailable", {
        provider: "openrouter",
        model: "primary",
        status: 503,
      }),
    );
    const fallback = vi.fn().mockResolvedValue({
      provider: "gemini",
      model: "gemini",
      rawResponse: "{}",
      durationMs: 10,
    });

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        { provider: provider(primary), providerName: "openrouter", model: "primary" },
        { provider: provider(fallback), providerName: "gemini", model: "gemini" },
      ],
      maxRetries: 1,
      timeoutMs: 1_000,
      baseDelayMs: 1,
    });

    await expect(retrying.analyzeApplication(input)).resolves.toMatchObject({
      provider: "gemini",
    });
    expect(primary).toHaveBeenCalledTimes(2);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("does not retry permanent provider errors", async () => {
    const analyze = vi.fn().mockRejectedValue(
      new AiProviderError("bad key", {
        provider: "openrouter",
        model: "primary",
        status: 401,
      }),
    );

    const retrying = new RetryingApplicationIntelligenceProvider({
      providers: [
        { provider: provider(analyze), providerName: "openrouter", model: "primary" },
      ],
      maxRetries: 2,
      timeoutMs: 1_000,
      baseDelayMs: 1,
    });

    await expect(retrying.analyzeApplication(input)).rejects.toThrow(
      "All configured AI providers failed",
    );
    expect(analyze).toHaveBeenCalledTimes(1);
  });
});
