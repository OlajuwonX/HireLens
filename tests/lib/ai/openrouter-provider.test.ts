import { afterEach, describe, expect, it, vi } from "vitest";
import { AiProviderError } from "@/lib/ai/provider-errors";
import { OpenRouterApplicationIntelligenceProvider } from "@/lib/ai/providers/openrouter-application-intelligence-provider";

const config = {
  apiKey: "test-key",
  model: "nvidia/nemotron-3-super-120b-a12b:free",
  timeoutMs: 1_000,
  maxOutputTokens: 16_000,
  siteUrl: "https://hirelens.test",
  appName: "HireLens",
};

const input = {
  resume: {
    pdfBytes: new Uint8Array(),
    filename: "resume.pdf",
    text: "Jane Doe, backend engineer.",
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function completion(content: string, finishReason = "stop") {
  return {
    choices: [{ message: { content }, finish_reason: finishReason }],
  };
}

function mockFetch(response: Response | Promise<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>) {
  return JSON.parse(fetchMock.mock.calls[0][1].body as string);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("OpenRouterApplicationIntelligenceProvider", () => {
  it("asks for the analysis schema instead of free-form json", async () => {
    const fetchMock = mockFetch(
      jsonResponse(completion('{"scoring":{"overallScore":80}}')),
    );

    await new OpenRouterApplicationIntelligenceProvider(
      config,
    ).analyzeApplication(input);

    const body = requestBody(fetchMock);

    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(
      body.response_format.json_schema.schema.properties.scoring,
    ).toBeDefined();
    expect(body.max_tokens).toBe(16_000);
    expect(body.model).toBe(config.model);
  });

  it("refuses providers that collect data and requires parameter support", async () => {
    const fetchMock = mockFetch(jsonResponse(completion("{}")));

    await new OpenRouterApplicationIntelligenceProvider(
      config,
    ).analyzeApplication(input);

    expect(requestBody(fetchMock).provider).toEqual({
      data_collection: "deny",
      require_parameters: true,
    });
  });

  it("allows data collection only when explicitly opted in", async () => {
    const fetchMock = mockFetch(jsonResponse(completion("{}")));

    await new OpenRouterApplicationIntelligenceProvider({
      ...config,
      allowDataCollection: true,
    }).analyzeApplication(input);

    expect(requestBody(fetchMock).provider).toEqual({
      require_parameters: true,
    });
  });

  it("turns reasoning off so a reasoning model answers promptly", async () => {
    const fetchMock = mockFetch(jsonResponse(completion("{}")));

    await new OpenRouterApplicationIntelligenceProvider(
      config,
    ).analyzeApplication(input);

    expect(requestBody(fetchMock).reasoning).toEqual({ enabled: false });
  });

  it("sends the resume text so the model can see the resume", async () => {
    const fetchMock = mockFetch(jsonResponse(completion("{}")));

    await new OpenRouterApplicationIntelligenceProvider(
      config,
    ).analyzeApplication(input);

    const body = requestBody(fetchMock);

    expect(body.messages[1].content).toContain("Jane Doe, backend engineer.");
  });

  it("fails without a network call when there is no resume text", async () => {
    const fetchMock = mockFetch(jsonResponse(completion("{}")));

    const error = (await new OpenRouterApplicationIntelligenceProvider(config)
      .analyzeApplication({
        ...input,
        resume: { ...input.resume, text: null },
      })
      .catch((thrown: unknown) => thrown)) as AiProviderError;

    expect(error).toBeInstanceOf(AiProviderError);
    expect(error.failureClass).toBe("PERMANENT");
    expect(error.code).toBe("NO_RESUME_TEXT");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("classifies a quota response as a rate limit", async () => {
    mockFetch(
      jsonResponse(
        { error: { message: "Rate limit exceeded", code: 429 } },
        429,
      ),
    );

    const error = (await new OpenRouterApplicationIntelligenceProvider(config)
      .analyzeApplication(input)
      .catch((thrown: unknown) => thrown)) as AiProviderError;

    expect(error.failureClass).toBe("RATE_LIMIT");
    expect(error.status).toBe(429);
  });

  it("classifies an upstream outage as transient", async () => {
    mockFetch(jsonResponse({ error: { message: "upstream" } }, 503));

    const error = (await new OpenRouterApplicationIntelligenceProvider(config)
      .analyzeApplication(input)
      .catch((thrown: unknown) => thrown)) as AiProviderError;

    expect(error.failureClass).toBe("TRANSIENT");
  });

  it("classifies an unknown model as permanent so the chain moves on", async () => {
    mockFetch(jsonResponse({ error: { message: "No such model" } }, 404));

    const error = (await new OpenRouterApplicationIntelligenceProvider(config)
      .analyzeApplication(input)
      .catch((thrown: unknown) => thrown)) as AiProviderError;

    expect(error.failureClass).toBe("PERMANENT");
    expect(error.message).toContain("No such model");
  });

  it("treats a truncated response as invalid output", async () => {
    mockFetch(jsonResponse(completion('{"scoring":', "length")));

    const error = (await new OpenRouterApplicationIntelligenceProvider(config)
      .analyzeApplication(input)
      .catch((thrown: unknown) => thrown)) as AiProviderError;

    expect(error.failureClass).toBe("INVALID_OUTPUT");
  });

  it("keeps the underlying cause when the network fails", async () => {
    const cause = new TypeError("fetch failed");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(cause));

    const error = (await new OpenRouterApplicationIntelligenceProvider(config)
      .analyzeApplication(input)
      .catch((thrown: unknown) => thrown)) as AiProviderError;

    expect(error.failureClass).toBe("TRANSIENT");
    expect(error.cause).toBe(cause);
  });
});
