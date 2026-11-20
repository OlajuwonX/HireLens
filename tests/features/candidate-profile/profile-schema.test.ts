import { describe, expect, it } from "vitest";
import {
  sponsorshipValue,
  toProfileFields,
} from "@/features/candidate-profile/profile-values";
import {
  profileSchema,
  splitList,
} from "@/features/candidate-profile/schemas/profile.schema";

const base = { workArrangements: [], willingToRelocate: false };

const accepts = (input: Record<string, unknown>) =>
  profileSchema.safeParse({ ...base, ...input }).success;

describe("splitList", () => {
  it("splits on commas and new lines, trims and drops blanks", () => {
    expect(splitList(" React ,\nTypeScript,, ")).toEqual(["React", "TypeScript"]);
  });

  it("removes case-insensitive duplicates", () => {
    expect(splitList("Remote, remote, London")).toEqual(["Remote", "London"]);
  });

  it("returns nothing for non-strings", () => {
    expect(splitList(undefined)).toEqual([]);
  });
});

describe("profileSchema", () => {
  it("accepts an empty form as a valid blank profile", () => {
    const parsed = profileSchema.parse({ ...base, headline: "", salaryMin: "" });

    expect(parsed.headline).toBeUndefined();
    expect(parsed.salaryMin).toBeUndefined();
    expect(parsed.targetRoles).toEqual([]);
  });

  it("coerces numbers from form strings", () => {
    const parsed = profileSchema.parse({
      ...base,
      yearsExperience: "5",
      salaryMin: "60000",
    });

    expect(parsed.yearsExperience).toBe(5);
    expect(parsed.salaryMin).toBe(60000);
  });

  it("rejects negative or fractional years", () => {
    expect(accepts({ yearsExperience: "-1" })).toBe(false);
    expect(accepts({ yearsExperience: "2.5" })).toBe(false);
  });

  it("rejects links that are not full URLs", () => {
    expect(accepts({ githubUrl: "github.com/me" })).toBe(false);
    expect(accepts({ githubUrl: "https://github.com/me" })).toBe(true);
  });

  it("uppercases and validates the currency", () => {
    expect(profileSchema.parse({ ...base, salaryCurrency: "usd" }).salaryCurrency).toBe("USD");
    expect(accepts({ salaryCurrency: "dollars" })).toBe(false);
  });

  it("only accepts known seniority and arrangements", () => {
    expect(accepts({ seniority: "GURU" })).toBe(false);
    expect(accepts({ workArrangements: ["NOT_SPECIFIED"] })).toBe(false);
  });

  it("caps list sizes", () => {
    const many = Array.from({ length: 11 }, (_, i) => `Role ${i}`).join(",");

    expect(accepts({ targetRoles: many })).toBe(false);
  });
});

describe("toProfileFields", () => {
  it("maps blanks to null and sponsorship to a boolean", () => {
    const fields = toProfileFields(
      profileSchema.parse({ ...base, requiresSponsorship: "NO", phone: "" }),
    );

    expect(fields.requiresSponsorship).toBe(false);
    expect(fields.phone).toBeNull();
  });

  it("keeps sponsorship unanswered when left blank", () => {
    const fields = toProfileFields(
      profileSchema.parse({ ...base, requiresSponsorship: "" }),
    );

    expect(fields.requiresSponsorship).toBeNull();
  });

  it("round-trips sponsorship for the form", () => {
    expect(sponsorshipValue(true)).toBe("YES");
    expect(sponsorshipValue(false)).toBe("NO");
    expect(sponsorshipValue(null)).toBe("");
  });
});
