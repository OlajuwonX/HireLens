import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MatchPanel } from "@/components/data-display/match-panel";
import { ScoreChip } from "@/components/data-display/score-chip";
import { TodayList } from "@/features/dashboard/components/today-list";
import { chipCount } from "@/features/discovery/components/arrangement-chips";
import { StageNav } from "@/features/applications/components/stage-nav";

const long = "Senior Principal Staff Frontend Platform Engineer, Design Systems and Accessibility (Remote, Europe/Africa) ".repeat(3);

describe("long and odd content", () => {
  it("keeps long Today titles wrapping inside the row", () => {
    const html = renderToStaticMarkup(
      h(TodayList, {
        items: [{ key: "a", count: 12345, title: long, detail: long, href: "/dashboard", urgent: false }],
      }),
    );

    expect(html).toContain("min-w-0 flex-1");
    expect(html).toContain("12345");
  });

  it("truncates a long job context in the match panel and clamps silly scores", () => {
    const html = renderToStaticMarkup(h(MatchPanel, { context: long, total: 140, parts: [{ label: "Skills", score: -20 }] }));

    expect(html).toMatch(/min-w-0 truncate[^"]*">Senior Principal/);
    expect(html).toContain(">100<");
    expect(html).toContain('aria-valuenow="0"');
  });

  it("clamps chips and shows a placeholder without a score", () => {
    expect(renderToStaticMarkup(h(ScoreChip, { score: 999 }))).toContain(">100<");
    expect(renderToStaticMarkup(h(ScoreChip, { score: null }))).toContain("--");
  });

  it("scrolls the stage bar sideways instead of squeezing it", () => {
    const html = renderToStaticMarkup(
      h(StageNav, { active: "ready", counts: { tracking: 4000, preparing: 0, "needs-you": 3, ready: 1, sent: 99999 } }),
    );

    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("min-w-max");
    expect(html).toContain('aria-current="page"');
  });

  it("totals every arrangement for Any, including unspecified ones", () => {
    const counts = { REMOTE: 4, HYBRID: 2, NOT_SPECIFIED: 7 };

    expect(chipCount("", counts)).toBe(13);
    expect(chipCount("ON_SITE", counts)).toBe(0);
    expect(chipCount("REMOTE", counts)).toBe(4);
  });
});
