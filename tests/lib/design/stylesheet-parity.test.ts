import { dark, light, type Palette } from "@/lib/design/theme";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/app.css", "utf8");

function blockFor(selector: string) {
  const start = css.indexOf(`${selector} {`);

  if (start === -1) {
    throw new Error(`missing ${selector} block in app/app.css`);
  }

  return css.slice(start, css.indexOf("}", start));
}

function customPropertiesIn(block: string) {
  const found = new Map<string, string>();

  for (const match of block.matchAll(
    /--hl-([a-z-]+):\s*(#[0-9a-fA-F]{3,8});/g,
  )) {
    found.set(match[1], match[2].toLowerCase());
  }

  return found;
}

function cssNameFor(role: string) {
  return role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

const modes: [string, string, Palette][] = [
  ["light", ":root", light],
  ["dark", ".dark", dark],
];

describe.each(modes)(
  "%s palette matches app.css",
  (_mode, selector, palette) => {
    const declared = customPropertiesIn(blockFor(selector));

    it("declares every role the palette defines", () => {
      const missing = (Object.keys(palette) as (keyof Palette)[])
        .map(cssNameFor)
        .filter((name) => !declared.has(name));

      expect(missing).toEqual([]);
    });

    it("uses the same hex value for every role", () => {
      const drift = (Object.keys(palette) as (keyof Palette)[])
        .map((role) => ({
          role,
          token: palette[role].toLowerCase(),
          css: declared.get(cssNameFor(role)),
        }))
        .filter(
          (entry) => entry.css !== undefined && entry.css !== entry.token,
        );

      expect(drift).toEqual([]);
    });
  },
);

describe("the theme layer", () => {
  it("maps every --hl- custom property to a --color- token", () => {
    const roots = customPropertiesIn(blockFor(":root"));
    const unmapped = [...roots.keys()].filter(
      (name) => !css.includes(`--color-${name}: var(--hl-${name})`),
    );

    expect(unmapped).toEqual([]);
  });
});
