import { describe, expect, it } from "vitest";
import { isShortlisted, rankScore, relevanceHint } from "@/lib/matching/rank";
import { LEVELS, levelFromSeniority, levelFromTitle } from "@/lib/matching/seniority";
import { toMatchView } from "@/features/matching/match-view";

describe("relevanceHint", () => {
  it("rewards titles that share the target role's words", () => {
    expect(relevanceHint("Senior Frontend Engineer", ["Frontend Engineer"])).toBe(1);
    expect(relevanceHint("Frontend Developer", ["Frontend Engineer"])).toBe(0.5);
    expect(relevanceHint("Accountant", ["Frontend Engineer"])).toBe(0);
  });

  it("is zero without targets", () => {
    expect(relevanceHint("Anything", [])).toBe(0);
  });
});

describe("rankScore and the shortlist", () => {
  it("lowers roles that need checking", () => {
    expect(rankScore(80, "PASS")).toBe(80);
    expect(rankScore(80, "CHECK")).toBe(70);
  });

  it("only shortlists eligible, well-scored roles", () => {
    expect(isShortlisted({ rank: 70, verdict: "PASS" })).toBe(true);
    expect(isShortlisted({ rank: 40, verdict: "PASS" })).toBe(false);
    expect(isShortlisted({ rank: 90, verdict: "FAIL" })).toBe(false);
    expect(isShortlisted({ rank: null, verdict: "PASS" })).toBe(false);
  });
});

describe("seniority", () => {
  it.each([
    ["Software Engineering Intern", LEVELS.INTERN],
    ["Junior Developer", LEVELS.JUNIOR],
    ["Software Engineer II", LEVELS.MID],
    ["Senior Frontend Engineer", LEVELS.SENIOR],
    ["Engineering Manager", LEVELS.LEAD],
    ["Staff Engineer", LEVELS.PRINCIPAL],
    ["Frontend Engineer", null],
  ])("%s", (title, level) => {
    expect(levelFromTitle(title)).toBe(level);
  });

  it("maps profile seniority", () => {
    expect(levelFromSeniority("SENIOR")).toBe(LEVELS.SENIOR);
    expect(levelFromSeniority(null)).toBeNull();
    expect(levelFromSeniority("WIZARD")).toBeNull();
  });
});

describe("toMatchView", () => {
  const row = {
    publicId: "m",
    postingPublicId: "p",
    title: "t",
    company: "c",
    location: null,
    rank: 70,
  };

  it("parses stored reasons and insight", () => {
    const view = toMatchView({
      ...row,
      fit: "GOOD",
      reasons: [{ rule: "SENIORITY", verdict: "CHECK", text: "One level up." }],
      insight: { strengths: ["React"], gaps: [], summary: "Good fit." },
    });

    expect(view.fit).toBe("GOOD");
    expect(view.reasons[0].text).toBe("One level up.");
    expect(view.insight?.summary).toBe("Good fit.");
  });

  it("survives malformed stored data", () => {
    const view = toMatchView({ ...row, fit: "AMAZING", reasons: "oops", insight: null });

    expect(view.fit).toBeNull();
    expect(view.reasons).toEqual([]);
    expect(view.insight).toBeNull();
  });
});
