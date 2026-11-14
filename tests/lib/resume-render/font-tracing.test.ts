import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const fonts = readFileSync("lib/resume-render/fonts.ts", "utf8");
const config = readFileSync("next.config.ts", "utf8");

describe("serverless functions stay small", () => {
  it("reads fonts through a literal path the build tracer can follow", () => {
    expect(fonts).toContain('path.join(process.cwd(), "public", "fonts", filename)');
  });

  it("never builds a file path from process.cwd() and an imported constant", () => {
    const joins = fonts.match(/path\.join\(process\.cwd\(\),[^)]*\)/g) ?? [];

    for (const join of joins) {
      expect(join).toMatch(/^path\.join\(process\.cwd\(\), "[^"]+", "[^"]+", filename\)$/);
    }
  });

  it("keeps the local worker out of every function bundle", () => {
    expect(config).toContain('"./local-worker/**"');
  });

  it("ships the fonts with the worker resume route", () => {
    expect(config).toContain('"/api/worker/**": ["./public/fonts/**"]');
  });
});
