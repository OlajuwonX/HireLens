import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BuilderSection } from "@/components/marketing/builder-section";
import { scenes } from "@/components/marketing/story/scenes";
import { StoryScroll } from "@/components/marketing/story/story-scroll";
import { PINNED_QUERY } from "@/components/marketing/story/story-motion";
import { nearestIndex, stepLabel } from "@/lib/marketing/story";

describe("story helpers", () => {
  it("picks the scene closest to the scroll position", () => {
    const stops = [0, 0.2, 0.4, 0.6, 0.8, 0.95];

    expect(nearestIndex(0, stops)).toBe(0);
    expect(nearestIndex(0.29, stops)).toBe(1);
    expect(nearestIndex(1, stops)).toBe(5);
    expect(nearestIndex(0.5, [])).toBe(0);
  });

  it("labels steps with two digits and never past the end", () => {
    expect(stepLabel(0, 6)).toBe("01 / 06");
    expect(stepLabel(9, 6)).toBe("06 / 06");
  });
});

describe("the landing story", () => {
  const html = renderToStaticMarkup(h(StoryScroll));

  it("renders every scene as readable content before any script runs", () => {
    expect(scenes).toHaveLength(6);
    for (const scene of scenes) {
      expect(html).toContain(scene.title);
      expect(html).toContain(`id="scene-${scene.id}"`);
    }
  });

  it("only stacks scenes once the pinned mode is switched on", () => {
    expect(html).not.toContain("data-pinned");
    expect(html).toContain("group-data-[pinned]/story:absolute");
  });

  it("never pins for people who ask for less motion or on small screens", () => {
    expect(PINNED_QUERY).toContain("prefers-reduced-motion: no-preference");
    expect(PINNED_QUERY).toContain("min-width: 1024px");
  });

  it("shows the real score panel in the match scene", () => {
    expect(html).toContain('role="meter"');
    expect(html).toContain("data-total");
  });

  it("keeps the hero entrance off for reduced motion", () => {
    const page = readFileSync("app/page.tsx", "utf8");

    expect(page).not.toMatch(/(?<!motion-safe:)\brise-in\b/);
  });
});

describe("the builder section", () => {
  it("links the author's profiles safely", () => {
    const html = renderToStaticMarkup(h(BuilderSection));

    expect(html).toContain('id="builder"');
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(3);
  });
});
