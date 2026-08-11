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

const solidPairs: [keyof Palette, keyof Palette][] = [
  ["accent", "accentText"],
  ["actionDark", "actionDarkText"],
  ["danger", "dangerText"],
  ["warning", "warningText"],
  ["info", "infoText"],
];

const onSurfaceRoles: (keyof Palette)[] = [
  "textPrimary",
  "textSecondary",
  "danger",
  "warning",
  "info",
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
    (background, foreground) => {
      expect(
        contrastRatio(palette[background], palette[foreground]),
      ).toBeGreaterThanOrEqual(AA);
    },
  );

  it.each(onSurfaceRoles)("%s reads on the card surface", (role) => {
    expect(
      contrastRatio(palette.surface, palette[role]),
    ).toBeGreaterThanOrEqual(AA);
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
