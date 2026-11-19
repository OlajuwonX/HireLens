import { describe, expect, it } from "vitest";
import { connectionProblem } from "../src/communication/connection";

const url = "https://example.vercel.app";

describe("connectionProblem", () => {
  it("is quiet when HireLens accepts the worker", () => {
    expect(connectionProblem(200, url)).toBeNull();
  });

  it("blames the token only on 401", () => {
    expect(connectionProblem(401, url)).toContain("rejected the worker token");
  });

  it("points at the address when the worker API is missing", () => {
    expect(connectionProblem(404, url)).toContain("HIRELENS_URL");
    expect(connectionProblem(404, url)).not.toContain("token");
  });

  it("explains network failures", () => {
    expect(connectionProblem(0, url)).toContain("Could not reach");
  });

  it("reports server errors", () => {
    expect(connectionProblem(500, url)).toContain("500");
  });
});
