import { describe, expect, it } from "vitest";
import {
  auditResumeEvidence,
  collectResumeEntities,
  compareOptimizationPasses,
  extractNumericEvidence,
} from "@/lib/ai/evidence-audit";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";

const NURSE_SOURCE = [
  "Chinelo Eze, Registered Nurse",
  "St James's University Hospital — Staff Nurse, acute medical unit.",
  "Leeds Teaching Hospitals NHS Trust — Healthcare Assistant.",
  "BSc Adult Nursing, University of Leeds.",
  "NMC Registration, Nursing and Midwifery Council.",
  "Immediate Life Support, Resuscitation Council UK.",
  "Skills: venepuncture, cannulation, triage, safeguarding, care planning.",
].join("\n");

function nurseResume(overrides: Record<string, unknown> = {}) {
  return improvedResumeSchema.parse({
    header: {
      name: "Chinelo Eze",
      headline: "Registered Nurse",
      location: "Leeds",
      email: null,
      phone: null,
      links: [],
    },
    professionalSummary: "Registered nurse on an acute medical unit.",
    skills: [
      {
        category: "Clinical",
        items: ["Venepuncture", "Cannulation", "Triage", "Safeguarding"],
      },
    ],
    experience: [
      {
        company: "St James's University Hospital",
        title: "Staff Nurse",
        location: "Leeds",
        startDate: "2021",
        endDate: "Present",
        bullets: ["Ran the acute medical unit handover."],
      },
      {
        company: "Leeds Teaching Hospitals NHS Trust",
        title: "Healthcare Assistant",
        location: "Leeds",
        startDate: "2019",
        endDate: "2021",
        bullets: ["Supported care planning across the ward."],
      },
    ],
    projects: [],
    education: [
      {
        qualification: "BSc Adult Nursing",
        institution: "University of Leeds",
        date: "2019",
      },
    ],
    certifications: [
      {
        name: "NMC Registration",
        issuer: "Nursing and Midwifery Council",
        date: null,
      },
      {
        name: "Immediate Life Support",
        issuer: "Resuscitation Council UK",
        date: "2023",
      },
    ],
    additionalSections: [],
    ...overrides,
  });
}

describe("collectResumeEntities", () => {
  const entities = collectResumeEntities(nurseResume());

  it("collects employers, titles, education, certifications and skills", () => {
    expect(entities).toEqual(
      expect.arrayContaining([
        "st james s university hospital",
        "staff nurse",
        "leeds teaching hospitals nhs trust",
        "bsc adult nursing",
        "university of leeds",
        "nmc registration",
        "immediate life support",
        "venepuncture",
        "safeguarding",
      ]),
    );
  });

  it("normalizes punctuation and case so wording changes do not count as loss", () => {
    expect(entities).toContain("st james s university hospital");
    expect(entities).not.toContain("St James's University Hospital");
  });

  it("drops entries too short to match safely", () => {
    const entities = collectResumeEntities(
      nurseResume({
        skills: [{ category: "Clinical", items: ["R", "IV", "Triage"] }],
      }),
    );

    expect(entities).toContain("triage");
    expect(entities).not.toContain("r");
    expect(entities).not.toContain("iv");
  });
});

describe("named evidence is checked against the source resume", () => {
  it("counts an entity the source supports and the resume keeps", () => {
    const audit = auditResumeEvidence({
      sourceText: NURSE_SOURCE,
      resumeText: "Staff Nurse at St James's University Hospital.",
      entities: collectResumeEntities(nurseResume()),
    });

    expect(audit.preservedEntities).toEqual(
      expect.arrayContaining(["st james s university hospital", "staff nurse"]),
    );
  });

  it("reports an entity the source supports but the resume dropped", () => {
    const audit = auditResumeEvidence({
      sourceText: NURSE_SOURCE,
      resumeText: "Staff Nurse at St James's University Hospital.",
      entities: collectResumeEntities(nurseResume()),
    });

    expect(audit.lostEntities).toEqual(
      expect.arrayContaining(["nmc registration", "venepuncture"]),
    );
  });

  it("ignores an entity the source resume never supported", () => {
    const audit = auditResumeEvidence({
      sourceText: NURSE_SOURCE,
      resumeText: "Advanced Nurse Practitioner at Barts Health.",
      entities: ["barts health", "advanced nurse practitioner"],
    });

    expect(audit.preservedEntities).toEqual([]);
    expect(audit.lostEntities).toEqual([]);
  });
});

describe("TEST H+I: a resume with no metrics is now protected too", () => {
  const full = nurseResume();
  const fullText = [
    "Staff Nurse, St James's University Hospital.",
    "Healthcare Assistant, Leeds Teaching Hospitals NHS Trust.",
    "BSc Adult Nursing, University of Leeds.",
    "NMC Registration. Immediate Life Support.",
    "Venepuncture, Cannulation, Triage, Safeguarding.",
  ].join("\n");

  it("confirms the source carries no numeric evidence to rely on", () => {
    expect(extractNumericEvidence(NURSE_SOURCE)).toEqual([]);
  });

  it("keeps the previous version when a pass drops the registration", () => {
    const stripped = nurseResume({ certifications: [] });

    const decision = compareOptimizationPasses({
      sourceText: NURSE_SOURCE,
      previousResumeText: fullText,
      nextResumeText: fullText
        .replace("NMC Registration. Immediate Life Support.", "")
        .trim(),
      previousEntities: collectResumeEntities(full),
      nextEntities: collectResumeEntities(stripped),
    });

    expect(decision.keepPrevious).toBe(true);
    expect(decision.reason).toBe("LOST_NAMED_EVIDENCE");
  });

  it("keeps the previous version when a pass drops an employer", () => {
    const decision = compareOptimizationPasses({
      sourceText: NURSE_SOURCE,
      previousResumeText: fullText,
      nextResumeText: fullText.replace(
        "Healthcare Assistant, Leeds Teaching Hospitals NHS Trust.",
        "",
      ),
      previousEntities: collectResumeEntities(full),
      nextEntities: collectResumeEntities(full),
    });

    expect(decision.keepPrevious).toBe(true);
    expect(decision.reason).toBe("LOST_NAMED_EVIDENCE");
  });

  it("accepts a pass that rewords without losing named evidence", () => {
    const decision = compareOptimizationPasses({
      sourceText: NURSE_SOURCE,
      previousResumeText: fullText,
      nextResumeText: fullText.replace(
        "Ran the acute medical unit handover.",
        "Led handover on the acute medical unit.",
      ),
      previousEntities: collectResumeEntities(full),
      nextEntities: collectResumeEntities(full),
    });

    expect(decision.keepPrevious).toBe(false);
    expect(decision.reason).toBe("NOT_WORSE");
  });

  it("accepts a pass that surfaces a certification the previous one hid", () => {
    const decision = compareOptimizationPasses({
      sourceText: NURSE_SOURCE,
      previousResumeText: fullText.replace("NMC Registration. ", ""),
      nextResumeText: fullText,
      previousEntities: collectResumeEntities(full),
      nextEntities: collectResumeEntities(full),
    });

    expect(decision.keepPrevious).toBe(false);
    expect(decision.reason).toBe("NOT_WORSE");
  });
});

describe("named evidence and numeric evidence are both enforced", () => {
  const source = [
    "Ada Okonkwo, Frontend Engineer.",
    "Improved rendering performance by 30% at Turner.",
    "Skills: React, Azure, Express.js.",
  ].join("\n");

  it("rejects a pass that keeps the metric but drops the technology", () => {
    const decision = compareOptimizationPasses({
      sourceText: source,
      previousResumeText:
        "Improved rendering performance by 30% at Turner. React, Azure, Express.js.",
      nextResumeText: "Improved rendering performance by 30% at Turner. React.",
      previousEntities: ["turner", "react", "azure", "express js"],
      nextEntities: ["turner", "react"],
    });

    expect(decision.keepPrevious).toBe(true);
    expect(decision.reason).toBe("LOST_NAMED_EVIDENCE");
  });

  it("reports a lost metric ahead of lost named evidence", () => {
    const decision = compareOptimizationPasses({
      sourceText: source,
      previousResumeText:
        "Improved rendering performance by 30% at Turner. React, Azure, Express.js.",
      nextResumeText: "Improved performance. React.",
      previousEntities: ["turner", "react", "azure", "express js"],
      nextEntities: ["react"],
    });

    expect(decision.keepPrevious).toBe(true);
    expect(decision.reason).toBe("LOST_EVIDENCE");
  });
});

describe("a metric written out in words is still the same metric", () => {
  it("reads 30 percent and 30% as one token", () => {
    expect(extractNumericEvidence("improved by 30 percent")).toEqual(
      extractNumericEvidence("improved by 30%"),
    );
  });

  it("does not report a reworded metric as lost", () => {
    const audit = auditResumeEvidence({
      sourceText: "Improved rendering performance by 30%.",
      resumeText: "Improved rendering performance by 30 percent.",
    });

    expect(audit.lost).toEqual([]);
    expect(audit.unsupported).toEqual([]);
  });
});
