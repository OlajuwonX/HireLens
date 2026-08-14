import { describe, expect, it } from "vitest";
import {
  detectEmploymentType,
  detectSalary,
  detectSource,
  detectWorkArrangement,
  findUrl,
  parseJobPosting,
} from "@/lib/jobs/parse-job-posting";
import { clipboardHtmlToText } from "@/lib/jobs/clipboard-html";

const LINKEDIN = `Home
My Network
Jobs
Messaging
Notifications

Senior Frontend Engineer
Acme Technologies · Lagos, Nigeria · Remote
Full-time · 3 weeks ago · 47 applicants

See who you know
Easy Apply
Save

About the job
Acme is hiring a Senior Frontend Engineer to lead our design system.
We work across twelve product teams and care about accessibility.

Requirements
- 5+ years building production React applications
- Deep TypeScript and Next.js experience

Benefits
- Private healthcare`;

describe("findUrl", () => {
  it("finds an http URL", () => {
    expect(findUrl("Apply at https://acme.example.com/jobs/1 today")).toBe(
      "https://acme.example.com/jobs/1",
    );
  });

  it("drops trailing punctuation", () => {
    expect(findUrl("See https://acme.example.com/jobs/1.")).toBe(
      "https://acme.example.com/jobs/1",
    );
  });

  it("returns null when there is none", () => {
    expect(findUrl("no link here")).toBeNull();
  });
});

describe("detectSource", () => {
  it("reads the platform from a URL host", () => {
    expect(detectSource("", "https://www.linkedin.com/jobs/view/1")).toBe(
      "LinkedIn",
    );
    expect(detectSource("", "https://boards.greenhouse.io/acme/jobs/1")).toBe(
      "Greenhouse",
    );
  });

  it("falls back to interface markers", () => {
    expect(detectSource("Easy Apply", null)).toBe("LinkedIn");
  });

  it("returns null when nothing identifies it", () => {
    expect(detectSource("Senior Engineer at a startup", null)).toBeNull();
  });
});

describe("detectEmploymentType", () => {
  it.each([
    ["Full-time role", "FULL_TIME"],
    ["Part time", "PART_TIME"],
    ["6 month contract", "CONTRACT"],
    ["Summer internship", "INTERNSHIP"],
    ["Freelance gig", "FREELANCE"],
  ])("reads %s", (text, expected) => {
    expect(detectEmploymentType(text)).toBe(expected);
  });

  it("returns null when unstated", () => {
    expect(detectEmploymentType("Senior Engineer")).toBeNull();
  });
});

describe("detectWorkArrangement", () => {
  it.each([
    ["Fully remote", "REMOTE"],
    ["Hybrid, 2 days in office", "HYBRID"],
    ["On-site in Leeds", "ON_SITE"],
  ])("reads %s", (text, expected) => {
    expect(detectWorkArrangement(text)).toBe(expected);
  });

  it("prefers hybrid when both words appear", () => {
    expect(detectWorkArrangement("Hybrid remote role")).toBe("HYBRID");
  });
});

describe("detectSalary", () => {
  it("reads a plain range", () => {
    expect(detectSalary("Salary: 90000 - 120000 USD")).toEqual({
      salaryMin: 90000,
      salaryMax: 120000,
      currency: "USD",
    });
  });

  it("reads a symbol range with separators", () => {
    expect(detectSalary("£45,000 - £60,000 per year")).toEqual({
      salaryMin: 45000,
      salaryMax: 60000,
      currency: "GBP",
    });
  });

  it("expands k notation", () => {
    expect(detectSalary("$90k - $120k")).toEqual({
      salaryMin: 90000,
      salaryMax: 120000,
      currency: "USD",
    });
  });

  it("orders an inverted range", () => {
    expect(detectSalary("120000 - 90000 USD").salaryMin).toBe(90000);
  });

  it("reads a single figure into both bounds", () => {
    expect(detectSalary("Pays €70,000 annually")).toEqual({
      salaryMin: 70000,
      salaryMax: 70000,
      currency: "EUR",
    });
  });

  it("returns nulls when no figure is stated", () => {
    expect(detectSalary("Competitive salary")).toEqual({
      salaryMin: null,
      salaryMax: null,
      currency: null,
    });
  });
});

describe("parseJobPosting on a LinkedIn paste", () => {
  const { job, missing } = parseJobPosting({ text: LINKEDIN });

  it("needs no AI help", () => {
    expect(missing).toEqual([]);
  });

  it("reads the title and company", () => {
    expect(job.title).toBe("Senior Frontend Engineer");
    expect(job.company).toBe("Acme Technologies");
  });

  it("reads the location without the arrangement", () => {
    expect(job.location).toBe("Lagos, Nigeria");
  });

  it("reads the enums the form already uses", () => {
    expect(job.workArrangement).toBe("REMOTE");
    expect(job.employmentType).toBe("FULL_TIME");
  });

  it("identifies the platform", () => {
    expect(job.source).toBe("LinkedIn");
  });

  it("keeps the description body", () => {
    expect(job.description).toContain("design system");
    expect(job.description).toContain("accessibility");
  });

  it("separates the requirements section", () => {
    expect(job.requirements).toContain("5+ years");
    expect(job.requirements).not.toContain("Private healthcare");
  });

  it("strips navigation and applicant noise", () => {
    for (const noise of ["My Network", "Easy Apply", "47 applicants"]) {
      expect(JSON.stringify(job)).not.toContain(noise);
    }
  });
});

describe("parseJobPosting on a partial posting", () => {
  const { job, missing } = parseJobPosting({
    text: `Senior React Developer

Requirements:
React
TypeScript
Next.js
We move fast and value clear written communication across the team.`,
  });

  it("reads what it can", () => {
    expect(job.title).toBe("Senior React Developer");
  });

  it("reports the fields it could not determine", () => {
    expect(missing).toContain("company");
  });

  it("never invents a company", () => {
    expect(job.company).not.toBe("Unknown Company");
  });
});

describe("clipboardHtmlToText", () => {
  it("turns list items into bullets", () => {
    expect(
      clipboardHtmlToText("<ul><li>React</li><li>TypeScript</li></ul>"),
    ).toContain("- React");
  });

  it("breaks on block elements", () => {
    expect(
      clipboardHtmlToText("<p>One</p><p>Two</p>").trim().split("\n"),
    ).toContain("One");
  });

  it("decodes entities", () => {
    expect(clipboardHtmlToText("<p>R&amp;D&nbsp;team</p>")).toContain(
      "R&D team",
    );
  });

  it("drops scripts and styles", () => {
    expect(
      clipboardHtmlToText("<style>.a{color:red}</style><p>Role</p>"),
    ).not.toContain("color:red");
  });

  it("keeps heading text", () => {
    expect(clipboardHtmlToText("<h2>About the job</h2>")).toContain(
      "About the job",
    );
  });
});

describe("company detection stays conservative", () => {
  it("reads a company from its own line", () => {
    const { job } = parseJobPosting({
      text: `Backend Engineer
Monzo Bank
London, UK

About the job
We are building the future of banking with a small distributed platform team that owns payments end to end.`,
    });

    expect(job.company).toBe("Monzo Bank");
  });

  it("never treats a sentence as a company", () => {
    const { job, missing } = parseJobPosting({
      text: `Sr. Product Designer
we are a small team building tools for nurses. you would own design end to end.
figma, prototyping, some research.`,
    });

    expect(job.company).toBeNull();
    expect(missing).toContain("company");
  });

  it("never treats a section heading as a company", () => {
    const { job } = parseJobPosting({
      text: `Senior React Developer

Requirements:
React
TypeScript`,
    });

    expect(job.company).toBeNull();
  });
});

describe("the parser only asks for AI when it needs to", () => {
  it("asks for nothing on a complete LinkedIn paste", () => {
    expect(parseJobPosting({ text: LINKEDIN }).missing).toEqual([]);
  });

  it("accepts a short but real description", () => {
    const { missing } = parseJobPosting({
      text: `Backend Engineer
Monzo Bank

About the job
We are building the future of banking with a small distributed platform team that owns payments.`,
    });

    expect(missing).not.toContain("description");
  });

  it("asks for help when the posting has no recognisable shape", () => {
    const { missing } = parseJobPosting({
      text: "some role at somewhere, contact us for details about this opening please",
    });

    expect(missing.length).toBeGreaterThan(0);
  });
});
