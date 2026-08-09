import { describe, expect, it } from "vitest";
import { dark, light, type Palette } from "@/lib/design/theme";
import { typeScale } from "@/lib/design/typography";
import { space } from "@/lib/design/spaces";
import { controlHeight, controlHeightClass, radius } from "@/lib/design/size";

const HEX = /^#[0-9a-fA-F]{6}$/;
const REM_OR_CLAMP = /^(clamp\(|[\d.]+rem$|[\d.]+px$)/;

describe("theme palettes", () => {
  it("light and dark expose identical role sets", () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort());
  });

  it("every role resolves to a hex value", () => {
    for (const palette of [light, dark]) {
      for (const [role, value] of Object.entries(palette)) {
        expect(value, role).toMatch(HEX);
      }
    }
  });

  it("names roles by purpose, never by appearance", () => {
    const appearanceWords =
      /green|gray|grey|lime|black|white|red|blue|yellow|\d{3}$/i;

    for (const role of Object.keys(light) as (keyof Palette)[]) {
      expect(role, `${role} is named for appearance`).not.toMatch(
        appearanceWords,
      );
    }
  });

  it("inverts the action colour between modes", () => {
    expect(light.actionDark).not.toBe(dark.actionDark);
    expect(light.background).not.toBe(dark.background);
  });
});

describe("typography scale", () => {
  it("every entry carries size, weight and line height together", () => {
    for (const [name, style] of Object.entries(typeScale)) {
      expect(style.size, `${name}.size`).toBeTruthy();
      expect(style.weight, `${name}.weight`).toBeGreaterThanOrEqual(400);
      expect(style.lineHeight, `${name}.lineHeight`).toBeTruthy();
      expect(style.family, `${name}.family`).toMatch(/^(sans|mono)$/);
    }
  });

  it("keeps heading weight at 600 so 700+ stays rare", () => {
    for (const name of [
      "display",
      "pageTitle",
      "sectionTitle",
      "cardMetric",
    ] as const) {
      expect(typeScale[name].weight, name).toBe(600);
    }
  });

  it("uses the mono family only for system labels", () => {
    const monoEntries = Object.entries(typeScale)
      .filter(([, style]) => style.family === "mono")
      .map(([name]) => name);

    expect(monoEntries).toEqual(["systemLabel"]);
  });
});

describe("geometry tokens", () => {
  it("keeps primary controls square and cards at 6px", () => {
    expect(radius.none).toBe("0px");
    expect(radius.control).toBe("2px");
    expect(radius.card).toBe("6px");
    expect(radius.panel).toBe("6px");
  });

  it("never exceeds the 6px ceiling except for pills", () => {
    for (const [name, value] of Object.entries(radius)) {
      if (name === "full") continue;
      expect(Number.parseInt(value, 10), name).toBeLessThanOrEqual(6);
    }
  });

  it("keeps the primary control height in the 40-44px band", () => {
    expect(controlHeight.primary).toBe("2.75rem");
    expect(controlHeight.default).toBe("2.5rem");
  });

  it("maps every control height to a tailwind class", () => {
    expect(Object.keys(controlHeight).sort()).toEqual(
      Object.keys(controlHeightClass).sort(),
    );
  });
});

describe("spacing scale", () => {
  it("expresses every step in rem or zero", () => {
    for (const [name, value] of Object.entries(space)) {
      expect(value, name).toMatch(REM_OR_CLAMP);
    }
  });

  it("increases monotonically", () => {
    const values = Object.values(space).map((v) => Number.parseFloat(v));

    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});
