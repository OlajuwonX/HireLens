import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0 && !line.trim().startsWith("#")) {
    process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
}

const { getApplicationIntelligenceProvider } = await import("@/lib/ai/client");
const { applicationIntelligenceSchema } = await import(
  "@/lib/ai/schemas/application-intelligence.schema"
);
const { normalizeJsonModelOutput } = await import("@/lib/ai/normalize");

const RESUME = `Jane Doe - Senior Backend Engineer, Lagos, Nigeria
Paystack 2021-2025: payment reconciliation services in Node.js and PostgreSQL, cut settlement latency by moving batch jobs to a queue, mentored two junior engineers.
Flutterwave 2019-2021: REST APIs serving 2M requests/day, added integration tests to payouts.
Skills: TypeScript, Node.js, PostgreSQL, Redis, AWS, Docker. BSc Computer Science, University of Lagos, 2019.`;

describe("real provider chain, live", () => {
  it("produces a schema-valid analysis through the production code path", async () => {
    const provider = getApplicationIntelligenceProvider();
    const started = Date.now();

    const result = await provider.analyzeApplication({
      resume: { pdfBytes: new Uint8Array(), filename: "jane.pdf", text: RESUME },
      job: {
        title: "Senior Backend Engineer",
        company: "Acme Payments",
        location: "Remote",
        workArrangement: "Remote",
        employmentType: "Full-time",
        deadline: null,
        source: null,
        sourceUrl: null,
        description:
          "Own the payments platform. Design TypeScript services, run Postgres at scale, lead a small team. Kubernetes preferred.",
        requirements:
          "5+ years backend engineering. Strong TypeScript and PostgreSQL. Experience leading engineers. Kubernetes a plus.",
      },
      priorCorrections: [],
    });

    const parsed = normalizeJsonModelOutput(
      result.rawResponse,
      applicationIntelligenceSchema,
    );

    console.log(
      `CHAIN provider=${result.provider} model=${result.model} wall=${Date.now() - started}ms score=${parsed.scoring.overallScore} ats=${parsed.scoring.atsScore} reqs=${parsed.requirementMatches.length} recs=${parsed.recommendations.length} cover=${parsed.coverLetter.length} email=${parsed.applicationEmail.subject.slice(0, 40)}`,
    );

    expect(parsed.scoring.overallScore).toBeGreaterThan(0);
  }, 120_000);

  it("extracts a job posting through the same chain", async () => {
    const provider = getApplicationIntelligenceProvider();
    const started = Date.now();
    const result = await provider.extractJobPosting({
      content:
        "Senior Product Designer at Northwind Labs. Remote (UK). Full-time. Salary 65000-80000 GBP. We are hiring a product designer to own our design system and mentor two designers. Requirements: 5 years product design, Figma, design systems.",
    });
    console.log(`EXTRACT provider=${result.provider} model=${result.model} wall=${Date.now() - started}ms raw=${String(result.rawResponse).slice(0, 120)}`);
    expect(result.rawResponse).toBeTruthy();
  }, 120_000);
});
