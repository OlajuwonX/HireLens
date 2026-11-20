import { describe, expect, it } from "vitest";
import { cleanDescription, containsHtml, htmlToText } from "@/lib/discovery/normalize";
import { toTextBlocks } from "@/lib/text/blocks";

const storedBadly = `<p>&nbsp;</p>
<p>At go-e, we are shaping the future of e-mobility.</p>
<p>Our IoT infrastructure operates at massive scale:</p>
<ul>
<li><strong>100+ PB</strong> of raw telemetry data</li>
<li><strong>250k+ requests per second</strong> flat</li>
</ul>
<h4>Your area of responsibility</h4>
<ol>
<li><strong>Scale the backend:</strong> Own the scaling strategy.</li>
<li><strong>Own backend security: </strong>Identity &amp; authorization.</li>
</ol>
<h3>What you bring</h3>
<ul>
<li><strong>Security &amp; Identity Mastery:</strong> OAuth2/OIDC.</li>
</ul>`;

const escapedBySource = storedBadly.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

describe("descriptions with escaped HTML from job feeds", () => {
  it("are fully converted even when the source escaped the HTML", () => {
    const text = htmlToText(escapedBySource);

    expect(containsHtml(text)).toBe(false);
    expect(text).not.toMatch(/&(amp|nbsp|lt|gt);/);
    expect(text).toContain("Security & Identity Mastery: OAuth2/OIDC.");
  });

  it("are repaired on display when they were stored before the fix", () => {
    const text = cleanDescription(storedBadly);

    expect(containsHtml(text)).toBe(false);
    expect(text).toContain("Identity & authorization.");
  });

  it("leave already clean text untouched", () => {
    expect(cleanDescription("Build React apps.\n\n- Ship features")).toBe("Build React apps.\n\n- Ship features");
  });

  it("do not mistake comparisons for tags", () => {
    expect(containsHtml("Salary < 100k and experience > 3 years")).toBe(false);
  });
});

describe("toTextBlocks formats the description", () => {
  const blocks = toTextBlocks(htmlToText(escapedBySource));

  it("turns section titles into headings", () => {
    expect(blocks.filter((block) => block.kind === "heading").map((block) => block.text)).toEqual([
      "Your area of responsibility",
      "What you bring",
    ]);
  });

  it("turns list items into bullet lists", () => {
    const lists = blocks.filter((block) => block.kind === "list");

    expect(lists.map((list) => list.items.length)).toEqual([2, 2, 1]);
    expect(lists[0].items[0]).toBe("100+ PB of raw telemetry data");
  });

  it("keeps sentences as paragraphs", () => {
    expect(blocks.find((block) => block.kind === "paragraph")).toEqual({
      kind: "paragraph",
      text: "At go-e, we are shaping the future of e-mobility.",
    });
  });

  it("treats plain bullets and numbered lines as lists", () => {
    expect(toTextBlocks("Requirements:\n- React\n- TypeScript\n1. Ship it")).toEqual([
      { kind: "paragraph", text: "Requirements:" },
      { kind: "list", items: ["React", "TypeScript", "Ship it"] },
    ]);
  });
});
