import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("lib/db/client.ts", "utf8");

describe("a dropped Neon connection cannot take the process down", () => {
  it("registers a pool error listener", () => {
    expect(source).toContain('pool.on("error"');
  });

  it("reports the dropped connection rather than swallowing it silently", () => {
    expect(source).toContain("Sentry.captureException");
  });

  it("registers the listener before the pool is handed to drizzle", () => {
    expect(source.indexOf('pool.on("error"')).toBeLessThan(
      source.indexOf("drizzle(pool"),
    );
  });
});

describe("why the listener matters", () => {
  it("an emitter with no error listener throws on error", () => {
    const emitter = new EventEmitter();

    expect(() => emitter.emit("error", new Error("connection lost"))).toThrow(
      "connection lost",
    );
  });

  it("an emitter with an error listener does not", () => {
    const emitter = new EventEmitter();
    const seen: Error[] = [];

    emitter.on("error", (error: Error) => seen.push(error));

    expect(() =>
      emitter.emit("error", new Error("connection lost")),
    ).not.toThrow();
    expect(seen).toHaveLength(1);
  });
});
