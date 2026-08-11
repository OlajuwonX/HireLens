import { describe, expect, it } from "vitest";
import { dark, light, type Palette } from "@/lib/design/theme";

const AA = 4.5;

function relativeLuminance(hex: string) {
  const channels = (hex.replace("#", "").match(/../g) ?? []).map((pair) => {
    const value = Number.parseInt(pair, 16) / 255;

    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(a: string, b: string) {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);

  return (
    (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
  );
}

const LARGE_TEXT = 3;

const solidPairs: [keyof Palette, keyof Palette, number][] = [
  ["accent", "accentText", AA],
  ["actionDark", "actionDarkText", AA],
  ["danger", "dangerText", LARGE_TEXT],
  ["warning", "warningText", AA],
  ["info", "infoText", AA],
];

const onSurfaceRoles: [keyof Palette, number][] = [
  ["textPrimary", AA],
  ["textSecondary", AA],
  ["danger", LARGE_TEXT],
  ["warning", AA],
  ["info", AA],
];

describe("contrastRatio", () => {
  it("reports the known extremes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });
});

describe.each([
  ["light", light],
  ["dark", dark],
])("%s palette", (_mode, palette) => {
  it.each(solidPairs)(
    "a solid %s surface carries readable %s",
    (background, foreground, minimum) => {
      expect(
        contrastRatio(palette[background], palette[foreground]),
      ).toBeGreaterThanOrEqual(minimum);
    },
  );

  it.each(onSurfaceRoles)("%s reads on the card surface", (role, minimum) => {
    expect(
      contrastRatio(palette.surface, palette[role]),
    ).toBeGreaterThanOrEqual(minimum);
  });

  it("keeps body text readable on the page background", () => {
    expect(
      contrastRatio(palette.background, palette.textPrimary),
    ).toBeGreaterThanOrEqual(AA);
  });

  it("pairs every semantic colour with its own foreground", () => {
    for (const [background, foreground] of solidPairs) {
      expect(palette[background]).not.toBe(palette[foreground]);
    }
  });
});
