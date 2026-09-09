import { describe, expect, it } from "vitest";
import {
  isActivePath,
  primaryNavigation,
} from "@/components/layout/navigation";

describe("primary navigation", () => {
  it("includes the Interview entry with a NEW badge", () => {
    const interview = primaryNavigation.find(
      (item) => item.href === "/dashboard/interview",
    );

    expect(interview).toBeDefined();
    expect(interview?.label).toBe("Interview");
    expect(interview?.badge).toBe("NEW");
  });

  it("keeps Interview after AI Documents in the list", () => {
    const hrefs = primaryNavigation.map((item) => item.href);

    expect(hrefs.indexOf("/dashboard/interview")).toBe(
      hrefs.indexOf("/dashboard/documents") + 1,
    );
  });

  it("only Interview carries a badge", () => {
    const badged = primaryNavigation.filter((item) => item.badge);

    expect(badged.map((item) => item.href)).toEqual(["/dashboard/interview"]);
  });
});

describe("isActivePath for the interview route", () => {
  it("matches the route and its subpaths", () => {
    expect(isActivePath("/dashboard/interview", "/dashboard/interview")).toBe(
      true,
    );
    expect(
      isActivePath("/dashboard/interview/week-1", "/dashboard/interview"),
    ).toBe(true);
  });

  it("does not treat the dashboard root as the interview route", () => {
    expect(isActivePath("/dashboard", "/dashboard/interview")).toBe(false);
    expect(isActivePath("/dashboard/interviewer", "/dashboard/interview")).toBe(
      false,
    );
  });
});
