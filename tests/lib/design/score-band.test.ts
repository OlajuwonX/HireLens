import { scoreBandFor } from "@/lib/design/score-band";
import { describe, expect, it } from "vitest";

describe("scoreBandFor", () => {
  it.each([
    [100, "STRONG"],
    [85, "STRONG"],
    [84.9, "GOOD"],
    [80, "GOOD"],
    [79.99, "FAIR"],
    [70, "FAIR"],
    [69.99, "WEAK"],
    [62, "WEAK"],
    [61.99, "POOR"],
    [0, "POOR"],
  ])("scores %s as %s", (score, band) => {
    expect(scoreBandFor(score).band).toBe(band);
  });

  it("clamps out-of-range scores", () => {
    expect(scoreBandFor(140).band).toBe("STRONG");
    expect(scoreBandFor(-20).band).toBe("POOR");
  });

  it("gives every band a two-stop gradient", () => {
    for (const score of [95, 82, 75, 65, 30]) {
      const spec = scoreBandFor(score);

      expect(spec.from).toMatch(/^#[0-9a-f]{6}$/);
      expect(spec.to).toMatch(/^#[0-9a-f]{6}$/);
      expect(spec.from).not.toBe(spec.to);
    }
  });

  it("labels every band", () => {
    for (const score of [95, 82, 75, 65, 30]) {
      expect(scoreBandFor(score).label).toMatch(/match$/);
    }
  });

  it("never leaves a gap between bands", () => {
    for (let score = 0; score <= 100; score += 0.5) {
      expect(scoreBandFor(score).band).toBeTruthy();
    }
  });
});
