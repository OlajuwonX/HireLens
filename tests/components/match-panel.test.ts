import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MatchPanel } from "@/components/data-display/match-panel";
import { ScoreChip } from "@/components/data-display/score-chip";
import { scoreParts, ScorePanel } from "@/features/analyses/components/score-panel";

const scoring = {
  overallScore: 82,
  atsScore: 91,
  requirementsScore: 88,
  skillsScore: 74,
  experienceScore: 55,
  keywordScore: 69,
  explanation: "Strong React evidence. GraphQL is missing.",
};

describe("MatchPanel", () => {
  it("shows the total, its band and one meter per part", () => {
    const html = renderToStaticMarkup(
      h(MatchPanel, { context: "Moniepoint · Lagos", total: 82, parts: [{ label: "Skills", score: 74 }, { label: "Experience", score: 55 }] }),
    );

    expect(html).toContain("The match");
    expect(html).toContain("Moniepoint · Lagos");
    expect(html).toContain("Strong fit");
    expect(html.match(/role="meter"/g)).toHaveLength(2);
    expect(html).toContain('aria-valuenow="74"');
    expect(html).toContain("55 / 100");
  });

  it("colours each bar by its own band", () => {
    const html = renderToStaticMarkup(
      h(MatchPanel, { total: 70, parts: [{ label: "A", score: 90 }, { label: "B", score: 65 }, { label: "C", score: 40 }] }),
    );
    const fills = [...html.matchAll(/data-score-fill="true" style="--score-rest:(\d+)%" class="([^"]+)"/g)];

    expect(fills.map((fill) => fill[1])).toEqual(["10", "35", "60"]);
    expect(fills[0][2]).toContain("text-accent");
    expect(fills[1][2]).toContain("text-ink-text");
    expect(fills[2][2]).toContain("text-ink-caution");
  });
});

describe("ScorePanel", () => {
  it("orders parts by what the candidate can act on, with ATS last", () => {
    expect(scoreParts(scoring).map((part) => part.label)).toEqual([
      "Requirements",
      "Skills",
      "Experience",
      "Keywords",
      "ATS readability",
    ]);
  });

  it("explains the score and links to the evidence when it exists", () => {
    const withEvidence = renderToStaticMarkup(h(ScorePanel, { scoring, showEvidence: true }));
    const without = renderToStaticMarkup(h(ScorePanel, { scoring }));

    expect(withEvidence).toContain("GraphQL is missing.");
    expect(withEvidence).toContain('href="#requirements"');
    expect(without).not.toContain('href="#requirements"');
  });

  it("renders nothing for an empty older analysis", () => {
    expect(renderToStaticMarkup(h(ScorePanel, { scoring: {} }))).toBe("");
  });

  it("averages the parts when an older analysis has no overall score", () => {
    const html = renderToStaticMarkup(h(ScorePanel, { scoring: { skillsScore: 80, experienceScore: 60 } }));

    expect(html).toContain("Fair fit");
    expect(html).toContain(">70<");
  });
});

describe("ScoreChip", () => {
  it("labels the score for screen readers and handles a missing score", () => {
    expect(renderToStaticMarkup(h(ScoreChip, { score: 91 }))).toContain('aria-label="Strong fit, 91 out of 100"');
    expect(renderToStaticMarkup(h(ScoreChip, { score: null }))).toContain("--");
  });
});

describe("no score rings remain", () => {
  it("uses the new pieces everywhere", () => {
    for (const file of [
      "features/applications/components/job-score-slot.tsx",
      "features/matching/components/match-card.tsx",
      "features/analyses/components/score-panel.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).not.toMatch(/ScoreRing|ScoreBlock/);
    }
  });
});
