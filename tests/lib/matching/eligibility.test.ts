import { describe, expect, it } from "vitest";
import {
  evaluateEligibility,
  type EligibilityPosting,
  type EligibilityProfile,
} from "@/lib/matching/eligibility";

const profile: EligibilityProfile = {
  seniority: "MID",
  currentLocation: "Lagos, Nigeria",
  targetLocations: ["London"],
  workArrangements: ["REMOTE", "HYBRID"],
  authorizedCountries: ["Nigeria"],
  requiresSponsorship: true,
  willingToRelocate: false,
};

const posting: EligibilityPosting = {
  title: "Frontend Engineer",
  location: "Remote",
  workArrangement: "REMOTE",
  description: "Build React apps.",
};

const check = (overrides: Partial<EligibilityPosting>, who: Partial<EligibilityProfile> = {}) =>
  evaluateEligibility({ ...profile, ...who }, { ...posting, ...overrides });

describe("evaluateEligibility", () => {
  it("passes a role that fits every preference", () => {
    expect(check({})).toEqual({ verdict: "PASS", reasons: [] });
  });

  it("passes everything when there is no profile yet", () => {
    expect(evaluateEligibility(null, { ...posting, workArrangement: "ON_SITE" }).verdict).toBe("PASS");
  });

  it("fails an arrangement the candidate does not want, and says why", () => {
    const result = check({ workArrangement: "ON_SITE", location: "London" });

    expect(result.verdict).toBe("FAIL");
    expect(result.reasons[0].text).toBe("On-site role; you prefer Remote or Hybrid.");
  });

  it("ignores arrangement when the posting does not say", () => {
    expect(check({ workArrangement: "NOT_SPECIFIED", location: null }).verdict).toBe("PASS");
  });

  it("passes a hybrid role in a city the candidate chose", () => {
    expect(check({ workArrangement: "HYBRID", location: "London, UK" }).verdict).toBe("PASS");
  });

  it("fails a hybrid role elsewhere unless the candidate will relocate", () => {
    const elsewhere = { workArrangement: "HYBRID", location: "Berlin, Germany" };

    expect(check(elsewhere).verdict).toBe("FAIL");
    expect(check(elsewhere, { willingToRelocate: true }).verdict).toBe("CHECK");
  });

  it("flags a remote role limited to another country", () => {
    const result = check({ location: "Remote - United States" });

    expect(result.verdict).toBe("CHECK");
    expect(result.reasons[0].text).toContain("United States");
  });

  it("accepts a remote role open to the candidate's country or anywhere", () => {
    expect(check({ location: "Remote - Nigeria" }).verdict).toBe("PASS");
    expect(check({ location: "Remote (Worldwide)" }).verdict).toBe("PASS");
  });

  it("flags a role one level up and fails one two levels away", () => {
    expect(check({ title: "Senior Frontend Engineer" }).verdict).toBe("CHECK");
    expect(check({ title: "Staff Frontend Engineer" }).verdict).toBe("FAIL");
    expect(check({ title: "Frontend Engineering Intern" }).verdict).toBe("FAIL");
  });

  it("does not treat a product manager as a lead role", () => {
    expect(check({ title: "Product Manager" }).verdict).toBe("PASS");
  });

  it("fails a role that will not sponsor when the candidate needs it", () => {
    const description = "Applicants must be authorized to work without visa sponsorship.";

    expect(check({ description }).verdict).toBe("FAIL");
    expect(check({ description }, { requiresSponsorship: false }).verdict).toBe("PASS");
  });
});
