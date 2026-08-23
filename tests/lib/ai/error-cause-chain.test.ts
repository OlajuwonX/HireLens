import { describe, expect, it } from "vitest";
import { describeAiFailure } from "@/lib/ai/errors";
import { AiProviderError } from "@/lib/ai/provider-errors";

describe("describeAiFailure", () => {
  it("unwraps the nested cause undici hides fetch failures behind", () => {
    const socket = Object.assign(
      new Error("Client network socket disconnected before secure TLS connection was established"),
      { code: "ECONNRESET" },
    );
    const fetchFailure = new TypeError("fetch failed", { cause: socket });
    const wrapped = new AiProviderError("fetch failed", {
      provider: "gemini",
      model: "gemini-3.5-flash-lite",
      cause: fetchFailure,
      failureClass: "TRANSIENT",
    });

    const described = describeAiFailure(wrapped);

    expect(described).toContain("provider=gemini");
    expect(described).toContain("cause=TypeError:fetch failed");
    expect(described).toContain("ECONNRESET");
  });

  it("stops before recursing forever on a cyclic cause", () => {
    const a = new Error("a");
    const b = new Error("b", { cause: a });
    (a as { cause?: unknown }).cause = b;

    expect(() => describeAiFailure(b)).not.toThrow();
  });
});
