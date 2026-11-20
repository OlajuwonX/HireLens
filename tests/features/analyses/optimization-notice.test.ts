import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { optimizationNotice } from "@/features/applications/optimization-notice";

describe("optimizationNotice", () => {
  it("explains an already optimized resume", () => {
    expect(optimizationNotice("already_optimized")).toMatch(/already optimized/);
  });

  it("explains a rejected regression", () => {
    expect(optimizationNotice("kept_previous")).toMatch(/kept the current version/);
  });

  it("ignores unknown or repeated values", () => {
    expect(optimizationNotice("improved")).toBeNull();
    expect(optimizationNotice(["already_optimized"])).toBeNull();
    expect(optimizationNotice(undefined)).toBeNull();
  });
});

describe("the re-analysis outcome reaches the user", () => {
  const action = readFileSync("features/applications/actions/application-actions.ts", "utf8");
  const page = readFileSync("app/(dashboard)/dashboard/jobs/page.tsx", "utf8");

  it("adds the flag only for outcomes worth announcing", () => {
    expect(action).toContain('outcome === "ALREADY_OPTIMIZED" || outcome === "KEPT_PREVIOUS"');
  });

  it("shows the notice on the jobs page", () => {
    expect(page).toContain("optimizationNotice(raw[OPTIMIZATION_FLAG])");
    expect(page).toContain("<UrlFlagToast");
  });
});
