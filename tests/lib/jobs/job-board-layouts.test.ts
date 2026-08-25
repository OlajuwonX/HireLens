import { describe, expect, it } from "vitest";
import { detectSalary, parseJobPosting } from "@/lib/jobs/parse-job-posting";
import { extractHtmlHeadings } from "@/lib/jobs/clipboard-html";

const COMPANY_FIRST = `Ravelin Technology·22 hours ago
Front End Engineer
United States
Full-time
Remote
Mid Level
2+ years exp
93%STRONG MATCH
Experience Level100%
Skill92%
Ravelin Technology is a fraud detection company using advanced machine learning to make online transactions safer, and the Front End Engineer will build the client side of that platform.
Responsibilities
Design and implement intuitive, scalable, and responsive user interfaces
Write efficient, maintainable code that performs well under heavy load
Qualification
Represents the skills you have
Find out how your skills align with this job's requirements. If anything seems off, click the tags.
JavaScript
TypeScript
React
HTML
CSS
Git
Required
2+ years' work experience as a front-end engineer
Familiarity with browser testing and debugging
Preferred
Experience with React and TypeScript
https://ravelin.pinpointhq.com/en/postings/1ac451eb`;

describe("a board that puts the company above the title", () => {
  const { job, layout, missing } = parseJobPosting({ text: COMPANY_FIRST });

  it("recognises the layout", () => {
    expect(layout).toBe("COMPANY_FIRST");
  });

  it("does not swap the title and the company", () => {
    expect(job.title).toBe("Front End Engineer");
    expect(job.company).toBe("Ravelin Technology");
  });

  it("never leaves the posting age in the title", () => {
    expect(job.title).not.toContain("hours ago");
  });

  it("reads a location that sits on its own line", () => {
    expect(job.location).toBe("United States");
  });

  it("still reads the enums and the posting url", () => {
    expect(job.workArrangement).toBe("REMOTE");
    expect(job.employmentType).toBe("FULL_TIME");
    expect(job.sourceUrl).toContain("ravelin.pinpointhq.com");
  });

  it("needs no AI help", () => {
    expect(missing).toEqual([]);
  });
});

describe("the description keeps the role and drops the board chrome", () => {
  const { job } = parseJobPosting({ text: COMPANY_FIRST });

  it("opens with the role, its level and its experience bar", () => {
    expect(job.description?.split("\n")[0]).toBe(
      "Front End Engineer · Mid Level · 2+ years exp",
    );
  });

  it("keeps the company blurb", () => {
    expect(job.description).toContain("fraud detection company");
  });

  for (const noise of [
    "93%STRONG MATCH",
    "Experience Level100%",
    "Skill92%",
    "22 hours ago",
    "Represents the skills you have",
    "Find out how your skills align",
    "https://",
  ]) {
    it(`drops ${JSON.stringify(noise)}`, () => {
      expect(job.description).not.toContain(noise);
      expect(job.requirements).not.toContain(noise);
    });
  }
});

describe("requirements carry every section the posting separated", () => {
  const { job } = parseJobPosting({ text: COMPANY_FIRST });

  it("keeps each heading", () => {
    for (const heading of [
      "Responsibilities",
      "Qualification",
      "Required",
      "Preferred",
    ]) {
      expect(job.requirements).toContain(heading);
    }
  });

  it("numbers prose items", () => {
    expect(job.requirements).toContain(
      "1. Design and implement intuitive, scalable, and responsive user interfaces",
    );
    expect(job.requirements).toContain(
      "2. Write efficient, maintainable code that performs well under heavy load",
    );
  });

  it("joins a run of skill chips onto one line", () => {
    expect(job.requirements).toContain(
      "JavaScript, TypeScript, React, HTML, CSS, Git.",
    );
  });

  it("never splits a camel-case skill name apart", () => {
    for (const mangled of ["Java, Script", "Type, Script", "AP, Is"]) {
      expect(job.requirements).not.toContain(mangled);
    }
  });

  it("keeps the preferred section as its own block", () => {
    expect(job.requirements).toContain("Experience with React and TypeScript");
  });
});

describe("a title-first board is unchanged", () => {
  const { job, layout } = parseJobPosting({
    text: `Senior Frontend Engineer
Acme Technologies · Lagos, Nigeria · Remote
Full-time · 3 weeks ago · 47 applicants

About the job
Acme is hiring a Senior Frontend Engineer to lead our design system across twelve product teams.

Requirements
- 5+ years building production React applications`,
  });

  it("keeps reading the title from the first line", () => {
    expect(layout).toBe("TITLE_FIRST");
    expect(job.title).toBe("Senior Frontend Engineer");
    expect(job.company).toBe("Acme Technologies");
    expect(job.location).toBe("Lagos, Nigeria");
  });
});

describe("clipboard headings settle the title when the layout is unusual", () => {
  it("reads headings out of pasted html", () => {
    expect(
      extractHtmlHeadings("<h2>About the job</h2><h1>Staff Engineer</h1>"),
    ).toEqual([
      { level: 2, text: "About the job" },
      { level: 1, text: "Staff Engineer" },
    ]);
  });

  it("prefers the h1 over the first line", () => {
    const { job } = parseJobPosting({
      text: `Monzo Bank
Staff Engineer
London, UK

About the job
We are building the future of banking with a platform team that owns payments end to end.`,
      html: "<h1>Staff Engineer</h1><h2>About the job</h2>",
    });

    expect(job.title).toBe("Staff Engineer");
    expect(job.company).toBe("Monzo Bank");
  });

  it("ignores an h1 that is not in the posting header", () => {
    const { job } = parseJobPosting({
      text: `Senior Frontend Engineer
Acme Technologies · Lagos, Nigeria

About the job
Acme is hiring a senior engineer to lead the design system across twelve product teams.`,
      html: "<h1>Careers at Acme</h1>",
    });

    expect(job.title).toBe("Senior Frontend Engineer");
  });
});

describe("junk that is not a posting still degrades to manual entry", () => {
  const { job, missing } = parseJobPosting({
    text: "some text a user copied by accident that is not a job posting at all, just a paragraph of prose with no structure whatsoever in it anywhere.",
  });

  it("reports every field as missing", () => {
    expect(missing).toEqual(["title", "company", "description"]);
  });

  it("invents no description", () => {
    expect(job.description).toBeNull();
  });
});

describe("salary ranges survive a unit suffix", () => {
  it("reads a per-year range instead of collapsing it", () => {
    expect(detectSalary("Base pay range $150K/yr - $170K/yr")).toEqual({
      salaryMin: 150000,
      salaryMax: 170000,
      currency: "USD",
    });
  });

  it("ignores figures below the annual-salary floor", () => {
    expect(detectSalary("$45/hour to $60/hour")).toEqual({
      salaryMin: null,
      salaryMax: null,
      currency: null,
    });
  });

  it("reads a per-annum range", () => {
    expect(detectSalary("£60,000 per annum – £75,000 per annum")).toEqual({
      salaryMin: 60000,
      salaryMax: 75000,
      currency: "GBP",
    });
  });

  it("reads european thousands separators", () => {
    expect(detectSalary("€80.000 - €95.000")).toEqual({
      salaryMin: 80000,
      salaryMax: 95000,
      currency: "EUR",
    });
  });

  it("still reads a plain range", () => {
    expect(detectSalary("$150k - $170k")).toEqual({
      salaryMin: 150000,
      salaryMax: 170000,
      currency: "USD",
    });
  });
});
