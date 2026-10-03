import { withoutSearchParams } from "@/features/applications/url-flags";
import { describe, expect, it } from "vitest";

const base = "https://hirelens.test/dashboard/jobs";

describe("withoutSearchParams", () => {
  it("drops the one-time flags and keeps the open drawer", () => {
    expect(withoutSearchParams(`${base}?open=abc&saved=1`, ["saved"])).toBe(
      `${base}?open=abc`,
    );
  });

  it("drops the analysis flags together", () => {
    expect(
      withoutSearchParams(
        `${base}?tab=INTERVIEW&open=abc&analysis=failed&reason=DAILY_LIMIT`,
        ["saved", "analysis", "reason"],
      ),
    ).toBe(`${base}?tab=INTERVIEW&open=abc`);
  });

  it("leaves a URL without flags unchanged", () => {
    expect(withoutSearchParams(`${base}?open=abc`, ["saved"])).toBe(
      `${base}?open=abc`,
    );
  });
});
