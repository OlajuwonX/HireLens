import { describe, expect, it } from "vitest";
import { clampScore, SCORE_FAIR, SCORE_STRONG, scoreToneFor } from "@/lib/design/score-band";

describe("scoreToneFor", () => {
  it.each([
    [100, "strong", "Strong fit"],
    [80, "strong", "Strong fit"],
    [79.4, "fair", "Fair fit"],
    [60, "fair", "Fair fit"],
    [59.4, "gap", "Weak fit"],
    [0, "gap", "Weak fit"],
  ])("scores %s as %s", (score, tone, label) => {
    expect(scoreToneFor(score)).toEqual({ tone, label });
  });

  it("rounds before banding, so the shown number and colour agree", () => {
    expect(scoreToneFor(79.6).tone).toBe("strong");
    expect(clampScore(79.6)).toBe(SCORE_STRONG);
    expect(scoreToneFor(59.5).tone).toBe("fair");
    expect(clampScore(59.5)).toBe(SCORE_FAIR);
  });

  it("clamps out-of-range scores", () => {
    expect(clampScore(140)).toBe(100);
    expect(clampScore(-20)).toBe(0);
    expect(scoreToneFor(140).tone).toBe("strong");
    expect(scoreToneFor(-20).tone).toBe("gap");
  });
});
