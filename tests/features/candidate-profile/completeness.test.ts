import { describe, expect, it } from "vitest";
import {
  profileCompleteness,
  type ProfileFields,
} from "@/features/candidate-profile/completeness";

const empty: ProfileFields = {
  headline: null,
  seniority: null,
  yearsExperience: null,
  currentLocation: null,
  targetRoles: [],
  targetLocations: [],
  workArrangements: [],
  authorizedCountries: [],
  requiresSponsorship: null,
  willingToRelocate: false,
  salaryMin: null,
  salaryCurrency: null,
  noticePeriodWeeks: null,
  phone: null,
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
};

const ready: ProfileFields = {
  ...empty,
  seniority: "MID",
  yearsExperience: 4,
  currentLocation: "Lagos, Nigeria",
  targetRoles: ["Frontend Engineer"],
  workArrangements: ["REMOTE"],
  authorizedCountries: ["Nigeria"],
  requiresSponsorship: false,
  phone: "+234 800 000 0000",
};

describe("profileCompleteness", () => {
  it("treats a missing profile as empty and not ready", () => {
    const result = profileCompleteness(null);

    expect(result.percent).toBe(0);
    expect(result.readyToApply).toBe(false);
    expect(result.missingRequired).toHaveLength(8);
  });

  it("is ready once every required field is filled", () => {
    const result = profileCompleteness(ready);

    expect(result.readyToApply).toBe(true);
    expect(result.missingRequired).toEqual([]);
    expect(result.percent).toBeGreaterThan(50);
    expect(result.percent).toBeLessThan(100);
  });

  it("counts no sponsorship and zero years as answered", () => {
    expect(profileCompleteness({ ...ready, yearsExperience: 0 }).readyToApply).toBe(true);
  });

  it("names exactly what is missing", () => {
    const result = profileCompleteness({
      ...ready,
      authorizedCountries: [],
      phone: "",
    });

    expect(result.missingRequired.map((item) => item.label)).toEqual([
      "Work authorization",
      "Phone",
    ]);
  });

  it("reaches 100% only when optional fields are filled too", () => {
    const result = profileCompleteness({
      ...ready,
      headline: "Frontend Engineer",
      targetLocations: ["Remote"],
      salaryMin: 50000,
      noticePeriodWeeks: 4,
      linkedinUrl: "https://linkedin.com/in/x",
      githubUrl: "https://github.com/x",
      portfolioUrl: "https://x.dev",
    });

    expect(result.percent).toBe(100);
  });
});
