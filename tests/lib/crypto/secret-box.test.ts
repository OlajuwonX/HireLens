import { describe, expect, it } from "vitest";
import { openSecret, sealSecret } from "@/lib/crypto/secret-box";

describe("secret box", () => {
  it("round-trips a secret and never stores it in plain text", () => {
    const sealed = sealSecret("1//refresh-token", "server-secret");

    expect(sealed).not.toContain("refresh-token");
    expect(sealed.startsWith("v1.")).toBe(true);
    expect(openSecret(sealed, "server-secret")).toBe("1//refresh-token");
  });

  it("uses a fresh nonce every time", () => {
    expect(sealSecret("same", "key")).not.toBe(sealSecret("same", "key"));
  });

  it("refuses a wrong key or a tampered value", () => {
    const sealed = sealSecret("token", "right");
    const parts = sealed.split(".");

    expect(() => openSecret(sealed, "wrong")).toThrow();
    expect(() => openSecret([parts[0], parts[1], parts[2], "AAAA"].join("."), "right")).toThrow();
    expect(() => openSecret("garbage", "right")).toThrow("unknown format");
  });
});
