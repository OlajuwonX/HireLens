import { describe, expect, it } from "vitest";
import {
  arrangementFrom,
  companyFromToken,
  dateFrom,
  dedupeKey,
} from "@/lib/discovery/normalize";
import { parseBoardInput } from "@/lib/discovery/sources";

describe("parseBoardInput", () => {
  it.each([
    ["https://boards.greenhouse.io/stripe", "GREENHOUSE", "stripe"],
    ["job-boards.greenhouse.io/stripe/jobs/123", "GREENHOUSE", "stripe"],
    ["https://boards.greenhouse.io/embed/job_board?for=stripe", "GREENHOUSE", "stripe"],
    ["https://boards-api.greenhouse.io/v1/boards/stripe/jobs", "GREENHOUSE", "stripe"],
    ["https://jobs.lever.co/palantir/6ed76ce8-4156", "LEVER", "palantir"],
    ["jobs.ashbyhq.com/Ashby", "ASHBY", "Ashby"],
  ])("reads %s", (value, source, token) => {
    expect(parseBoardInput({ value })).toEqual({ source, token });
  });

  it("accepts a bare board name with a chosen source", () => {
    expect(parseBoardInput({ value: "acme", source: "LEVER" })).toEqual({
      source: "LEVER",
      token: "acme",
    });
  });

  it("rejects a bare name without a source", () => {
    expect(parseBoardInput({ value: "acme" })).toBeNull();
  });

  it("rejects other sites and junk", () => {
    expect(parseBoardInput({ value: "https://example.com/jobs" })).toBeNull();
    expect(parseBoardInput({ value: "https://evil.com/greenhouse.io" })).toBeNull();
    expect(parseBoardInput({ value: "   " })).toBeNull();
    expect(parseBoardInput({ value: "bad token!", source: "ASHBY" })).toBeNull();
  });
});

describe("normalize helpers", () => {
  it("builds one dedupe key for the same role across sources", () => {
    expect(dedupeKey({ company: "Acme, Inc.", title: "Sr. Front-End Developer" })).toBe(
      dedupeKey({ company: "acme", title: "Senior Frontend Engineer" }),
    );
    expect(dedupeKey({ company: "Stripe", title: "Full Stack Engineer" })).toBe("stripe|fullstack engineer");
  });

  it("keeps different roles and companies apart", () => {
    expect(dedupeKey({ company: "Acme", title: "Senior Engineer" })).not.toBe(dedupeKey({ company: "Acme", title: "Engineer" }));
    expect(dedupeKey({ company: "Acme", title: "Engineer" })).not.toBe(dedupeKey({ company: "Acme Pay", title: "Engineer" }));
  });

  it("prefers the source's explicit arrangement", () => {
    expect(arrangementFrom("On-site", "remote friendly")).toBe("ON_SITE");
    expect(arrangementFrom(null, "Engineer (Remote)")).toBe("REMOTE");
    expect(arrangementFrom(null, "Engineer")).toBe("NOT_SPECIFIED");
  });

  it("turns board names into company names", () => {
    expect(companyFromToken("acme-labs")).toBe("Acme Labs");
  });

  it("returns null for missing or invalid dates", () => {
    expect(dateFrom(null)).toBeNull();
    expect(dateFrom("not a date")).toBeNull();
  });
});
