import { clientIp } from "@/lib/rate-limit/client-ip";
import { describe, expect, it } from "vitest";

describe("clientIp", () => {
  it("prefers x-real-ip", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.7",
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });

    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    const headers = new Headers({
      "x-forwarded-for": " 198.51.100.1 , 10.0.0.1",
    });

    expect(clientIp(headers)).toBe("198.51.100.1");
  });

  it("returns unknown when no address header is present", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
