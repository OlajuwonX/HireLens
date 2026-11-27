import { describe, expect, it } from "vitest";
import { pageKey, samePage } from "@/features/extension/page-key";

describe("pageKey", () => {
  it("treats a job page and its apply page as the same job", () => {
    expect(samePage("https://jobs.lever.co/acme/123", "https://jobs.lever.co/acme/123/apply")).toBe(true);
    expect(samePage("https://jobs.ashbyhq.com/acme/abc", "https://jobs.ashbyhq.com/acme/abc/application?utm_source=x")).toBe(true);
  });

  it("matches old and new Greenhouse hosts", () => {
    expect(samePage("https://boards.greenhouse.io/stripe/jobs/1", "https://job-boards.greenhouse.io/stripe/jobs/1#app")).toBe(true);
  });

  it("keeps the job id when the company embeds Greenhouse on its own site", () => {
    expect(samePage("https://stripe.com/jobs/listing?gh_jid=1", "https://stripe.com/jobs/listing?gh_jid=1&src=li")).toBe(true);
    expect(samePage("https://stripe.com/jobs/listing?gh_jid=1", "https://stripe.com/jobs/listing?gh_jid=2")).toBe(false);
  });

  it("ignores case, www and trailing slashes but not different jobs", () => {
    expect(samePage("https://WWW.Example.com/Jobs/9/", "https://example.com/jobs/9")).toBe(true);
    expect(samePage("https://jobs.lever.co/acme/123", "https://jobs.lever.co/acme/124")).toBe(false);
  });

  it("never matches missing or invalid addresses", () => {
    expect(pageKey("not a url")).toBeNull();
    expect(samePage(null, "https://example.com")).toBe(false);
    expect(samePage("nope", "nope")).toBe(false);
  });
});
