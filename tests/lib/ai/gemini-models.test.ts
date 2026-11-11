import { describe, expect, it } from "vitest";
import { resolveGeminiModels } from "@/lib/ai/client";

describe("resolveGeminiModels", () => {
  it("uses the primary model alone by default", () => {
    expect(resolveGeminiModels({ GEMINI_MODEL: "flash-lite" })).toEqual([
      "flash-lite",
    ]);
  });

  it("appends trimmed fallback models in order", () => {
    expect(
      resolveGeminiModels({
        GEMINI_MODEL: "flash-lite",
        GEMINI_FALLBACK_MODELS: " flash , pro ",
      }),
    ).toEqual(["flash-lite", "flash", "pro"]);
  });

  it("drops blanks and duplicates of the primary", () => {
    expect(
      resolveGeminiModels({
        GEMINI_MODEL: "flash-lite",
        GEMINI_FALLBACK_MODELS: "flash-lite,, flash,flash",
      }),
    ).toEqual(["flash-lite", "flash"]);
  });
});

describe("OpenRouter is gone", () => {
  it("is not referenced by application code", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");

    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);

        return statSync(full).isDirectory()
          ? walk(full)
          : /\.tsx?$/.test(entry)
            ? [full]
            : [];
      });

    const offenders = ["app", "features", "lib", "components"]
      .flatMap(walk)
      .filter((file) => /openrouter/i.test(readFileSync(file, "utf8")));

    expect(offenders).toEqual([]);
  });
});
