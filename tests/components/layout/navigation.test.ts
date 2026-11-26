import { describe, expect, it } from "vitest";
import {
  isActiveItem,
  isActivePath,
  navigationGroups,
  primaryNavigation,
  tabNavigation,
} from "@/components/layout/navigation";

describe("grouped navigation", () => {
  it("follows the job search in order", () => {
    expect(navigationGroups.map((entry) => entry.label)).toEqual([null, "Find", "Apply", "Materials", "Hear back"]);
    expect(navigationGroups.flatMap((entry) => entry.items.map((item) => item.label))).toEqual([
      "Today",
      "Discover",
      "Applications",
      "Resumes",
      "AI Documents",
      "Replies",
      "Interview prep",
    ]);
  });

  it("puts every primary item in exactly one group", () => {
    const grouped = navigationGroups.flatMap((entry) => entry.items);

    expect(grouped).toHaveLength(primaryNavigation.length);
    expect(new Set(grouped.map((item) => item.href)).size).toBe(grouped.length);
  });

  it("keeps the phone tab bar to four sections plus More", () => {
    expect(tabNavigation.map((item) => item.label)).toEqual(["Today", "Discover", "Applications", "Replies"]);
  });

  it("only Interview prep carries a badge", () => {
    expect(primaryNavigation.filter((item) => item.badge).map((item) => item.href)).toEqual(["/dashboard/interview"]);
  });
});

describe("active matching", () => {
  const applications = primaryNavigation.find((item) => item.label === "Applications")!;

  it("treats the add-a-job page and the old Auto Apply link as part of Applications", () => {
    expect(isActiveItem("/dashboard/jobs", applications)).toBe(true);
    expect(isActiveItem("/dashboard/applications", applications)).toBe(true);
    expect(isActiveItem("/dashboard/auto-apply", applications)).toBe(true);
    expect(isActiveItem("/dashboard/discover", applications)).toBe(false);
  });

  it("matches a route and its subpaths but not look-alikes", () => {
    expect(isActivePath("/dashboard/interview/week-1", "/dashboard/interview")).toBe(true);
    expect(isActivePath("/dashboard/interviewer", "/dashboard/interview")).toBe(false);
    expect(isActivePath("/dashboard/jobs", "/dashboard")).toBe(false);
  });
});
