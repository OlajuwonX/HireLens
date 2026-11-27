import { describe, expect, it } from "vitest";
import { buildTodayItems, interviewWhen, plural, type TodaySignals } from "@/features/dashboard/today-items";

const now = new Date("2026-11-25T09:00:00Z");

const quiet: TodaySignals = {
  toApprove: 0,
  needsYou: 0,
  toReview: 0,
  goodReplies: 0,
  followUpsDue: 0,
  newMatches: 0,
  interviews: [],
};

describe("buildTodayItems", () => {
  it("shows nothing when nothing needs you", () => {
    expect(buildTodayItems(quiet, now)).toEqual([]);
  });

  it("lists interviews and good replies before routine work", () => {
    const items = buildTodayItems(
      {
        ...quiet,
        toApprove: 3,
        newMatches: 8,
        goodReplies: 1,
        interviews: [{ publicId: "app-1", company: "Paystack", at: new Date("2026-11-26T14:00:00Z") }],
      },
      now,
    );

    expect(items.map((item) => item.key)).toEqual(["interview-app-1", "good-replies", "approve", "matches"]);
    expect(items[0]).toMatchObject({
      title: "Interview with Paystack",
      detail: "tomorrow at 14:00. Open your preparation brief.",
      href: "/dashboard/jobs?open=app-1",
    });
  });

  it("writes correct plurals", () => {
    const one = buildTodayItems({ ...quiet, toApprove: 1, toReview: 1 }, now);
    const many = buildTodayItems({ ...quiet, toApprove: 2, toReview: 4 }, now);

    expect(one.map((item) => item.title)).toEqual(["1 application is ready to approve", "1 email to sort"]);
    expect(many.map((item) => item.title)).toEqual(["2 applications are ready to approve", "4 emails to sort"]);
  });

  it("links every item to the screen that resolves it", () => {
    const items = buildTodayItems(
      { ...quiet, toApprove: 1, needsYou: 1, toReview: 1, goodReplies: 1, followUpsDue: 1, newMatches: 1 },
      now,
    );

    expect(Object.fromEntries(items.map((item) => [item.key, item.href]))).toEqual({
      "good-replies": "/dashboard/responses",
      approve: "/dashboard/jobs?stage=ready",
      "needs-you": "/dashboard/jobs?stage=needs-you",
      review: "/dashboard/responses",
      "follow-ups": "/dashboard/jobs",
      matches: "/dashboard/discover/matches",
    });
  });
});

describe("helpers", () => {
  it("pluralizes with the English rules", () => {
    expect(plural(0, "thing", "things")).toBe("0 things");
    expect(plural(1, "thing", "things")).toBe("1 thing");
  });

  it("names the day of an interview", () => {
    expect(interviewWhen(new Date("2026-11-25T16:30:00Z"), now)).toBe("today at 16:30");
    expect(interviewWhen(new Date("2026-11-28T10:00:00Z"), now)).toBe("Saturday at 10:00");
    expect(interviewWhen(new Date("2026-12-09T10:00:00Z"), now)).toBe("9 Dec at 10:00");
  });
});
