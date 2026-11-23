import { describe, expect, it } from "vitest";
import { companyFromUrl, describePage } from "@/features/extension/page-job";

describe("companyFromUrl", () => {
  it("reads the company from job board paths", () => {
    expect(companyFromUrl("https://boards.greenhouse.io/acme-labs/jobs/123")).toBe("Acme Labs");
    expect(companyFromUrl("https://jobs.lever.co/stripe/abc/apply")).toBe("Stripe");
    expect(companyFromUrl("https://jobs.ashbyhq.com/linear/1")).toBe("Linear");
  });

  it("reads the company from job board subdomains", () => {
    expect(companyFromUrl("https://nvidia.wd5.myworkdayjobs.com/en-US/careers/job/1")).toBe("Nvidia");
    expect(companyFromUrl("https://acme.bamboohr.com/careers/12")).toBe("Acme");
  });

  it("falls back to the site name on company career pages", () => {
    expect(companyFromUrl("https://careers.monzo.com/jobs/1")).toBe("Monzo");
  });

  it("returns null for anything that is not an address", () => {
    expect(companyFromUrl("not a url")).toBeNull();
  });
});

describe("describePage", () => {
  it("gives the extractor the page title and address with the text", () => {
    expect(describePage({ url: "https://x.test/j", title: "Engineer at X", text: "Body" })).toBe(
      "Page title: Engineer at X\nPage address: https://x.test/j\n\nBody",
    );
  });
});
