import { describe, expect, it } from "vitest";
import { resolveProviderOrder } from "@/lib/ai/client";

describe("resolveProviderOrder", () => {
  it("puts the reliable provider first by default", () => {
    expect(resolveProviderOrder(undefined)).toEqual(["gemini", "openrouter"]);
  });

  it("honours an explicit order", () => {
    expect(resolveProviderOrder("openrouter,gemini")).toEqual([
      "openrouter",
      "gemini",
    ]);
  });

  it("tolerates spacing and casing", () => {
    expect(resolveProviderOrder(" OpenRouter , Gemini ")).toEqual([
      "openrouter",
      "gemini",
    ]);
  });

  it("lets a provider be dropped entirely", () => {
    expect(resolveProviderOrder("openrouter")).toEqual(["openrouter"]);
  });

  it("ignores names it does not know", () => {
    expect(resolveProviderOrder("gemini,acme,openrouter")).toEqual([
      "gemini",
      "openrouter",
    ]);
  });

  it("falls back to the default when nothing valid is configured", () => {
    expect(resolveProviderOrder("acme,,   ")).toEqual(["gemini", "openrouter"]);
  });

  it("does not repeat a provider listed twice", () => {
    expect(resolveProviderOrder("gemini,gemini,openrouter")).toEqual([
      "gemini",
      "openrouter",
    ]);
  });
});
