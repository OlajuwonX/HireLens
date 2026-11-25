import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { duration, easing, pressScale, spring } from "@/lib/design/motion";
import { fontFamily, typeScale } from "@/lib/design/typography";

const css = readFileSync("app/app.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const themeScript = readFileSync("components/theme/theme-script.tsx", "utf8");

function emOf(value: string | undefined) {
  return value ? Number.parseFloat(value) : 0;
}

describe("type follows the size-specific tracking rule", () => {
  it("tightens tracking as type grows and opens it on small labels", () => {
    expect(emOf(typeScale.display.tracking)).toBeLessThan(emOf(typeScale.pageTitle.tracking));
    expect(emOf(typeScale.pageTitle.tracking)).toBeLessThan(emOf(typeScale.sectionTitle.tracking));
    expect(emOf(typeScale.sectionTitle.tracking)).toBeLessThan(emOf(typeScale.body.tracking));
    expect(emOf(typeScale.systemLabel.tracking)).toBeGreaterThan(0);
  });

  it("keeps headings tight and body text near 1.5", () => {
    expect(Number(typeScale.display.lineHeight)).toBeLessThan(1.1);
    expect(Number(typeScale.body.lineHeight)).toBeGreaterThanOrEqual(1.45);
    expect(Number(typeScale.body.lineHeight)).toBeLessThanOrEqual(1.65);
  });

  it("matches the CSS tokens", () => {
    expect(css).toContain(`--text-display--letter-spacing: ${typeScale.display.tracking};`);
    expect(css).toContain(`--text-page-title--letter-spacing: ${typeScale.pageTitle.tracking};`);
    expect(css).toContain(`--text-system--letter-spacing: ${typeScale.systemLabel.tracking};`);
    expect(css).toContain(`--text-body: ${typeScale.body.size};`);
  });
});

describe("brand fonts", () => {
  it("uses Schibsted Grotesk and IBM Plex Mono everywhere, never Geist", () => {
    expect(layout).toContain("Schibsted_Grotesk");
    expect(layout).toContain("IBM_Plex_Mono");
    expect(`${layout}${css}${fontFamily.sans}${fontFamily.mono}`).not.toMatch(/geist/i);
    expect(css).toContain("var(--font-brand-sans)");
    expect(css).toContain("var(--font-brand-mono)");
  });
});

describe("motion stays within the design rules", () => {
  it("keeps everyday UI motion under 300ms", () => {
    for (const name of ["press", "fast", "menu", "panel"] as const) {
      expect(duration[name], name).toBeLessThan(300);
    }
  });

  it("presses subtly and never eases in", () => {
    expect(pressScale).toBeGreaterThanOrEqual(0.95);
    expect(pressScale).toBeLessThan(1);
    expect(Object.values(easing).join(" ")).not.toMatch(/ease-in\b/);
    expect(css).toContain(`--ease-out: ${easing.out};`);
    expect(css).toContain(`transform: scale(${pressScale});`);
  });

  it("only bounces after a flick", () => {
    expect(spring.settle.bounce).toBe(0);
    expect(spring.sheet.bounce).toBe(0);
    expect(spring.flick.bounce).toBeGreaterThan(0);
  });

  it("never animates every property", () => {
    expect(css).not.toContain("transition: all");
  });
});

describe("theme defaults to dark", () => {
  it("renders dark before scripts run and falls back to dark", () => {
    expect(layout).toMatch(/className=\{`[^`]*\bdark`\}/);
    expect(themeScript).toContain('DEFAULT_THEME = "dark"');
  });
});
