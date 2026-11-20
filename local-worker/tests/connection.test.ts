import { describe, expect, it } from "vitest";
import { connectionProblem, toPingResult } from "../src/communication/connection";

const url = "https://example.vercel.app";
const ping = (status: number, vercelProtected = false) => ({ status, vercelProtected });

describe("connectionProblem", () => {
  it("is quiet when HireLens accepts the worker", () => {
    expect(connectionProblem(ping(200), url)).toBeNull();
  });

  it("explains Vercel protection on preview links instead of blaming the token", () => {
    const message = connectionProblem(ping(302, true), url);

    expect(message).toContain("VERCEL_PROTECTION_BYPASS");
    expect(message).not.toContain("rejected the worker token");
  });

  it("blames the token only when HireLens itself answers 401", () => {
    expect(connectionProblem(ping(401), url)).toContain("rejected the worker token");
  });

  it("points at the address when the worker API is missing", () => {
    expect(connectionProblem(ping(404), url)).toContain("HIRELENS_URL");
  });

  it("explains network failures and server errors", () => {
    expect(connectionProblem(ping(0), url)).toContain("Could not reach");
    expect(connectionProblem(ping(500), url)).toContain("500");
  });
});

describe("toPingResult", () => {
  it("recognises the Vercel Authentication wall", () => {
    const response = new Response("Protected by Vercel Authentication", {
      status: 302,
      headers: { "set-cookie": "_vercel_sso_nonce=abc; Path=/", location: "https://vercel.com/sso-api?url=x" },
    });

    expect(toPingResult(response)).toEqual({ status: 302, vercelProtected: true });
  });

  it("treats a missing response as unreachable", () => {
    expect(toPingResult(null)).toEqual({ status: 0, vercelProtected: false });
  });

  it("passes HireLens answers through", () => {
    expect(toPingResult(new Response("{}", { status: 401 }))).toEqual({ status: 401, vercelProtected: false });
  });
});
