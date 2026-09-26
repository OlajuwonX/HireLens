import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("migration", () => {
  const journal = JSON.parse(read("drizzle/meta/_journal.json")) as {
    entries: { tag: string }[];
  };
  const tag = journal.entries.at(-1)?.tag ?? "";
  const sql = read(`drizzle/${tag}.sql`);

  it("is a single additive column with a constant default", () => {
    expect(sql.trim()).toBe(
      'ALTER TABLE "applications" ADD COLUMN "save_only" boolean DEFAULT false NOT NULL;',
    );
  });

  it("does not drop, rename or rewrite anything", () => {
    expect(sql).not.toMatch(/DROP|RENAME|ALTER COLUMN|UPDATE|DELETE/i);
  });

  it("is mirrored in the schema so existing rows read false", () => {
    expect(read("lib/db/schema.ts")).toContain(
      'saveOnly: boolean("save_only").notNull().default(false)',
    );
  });
});

describe("save form", () => {
  const form = read("features/applications/components/save-and-analyze-form.tsx");

  it("offers Save before Save & Analyze, both submitting the same form", () => {
    expect(form.indexOf('value="save"')).toBeGreaterThan(-1);
    expect(form.indexOf('value="save"')).toBeLessThan(
      form.indexOf('value="analyze"'),
    );
    expect(form).toContain('name="intent"');
    expect(form.match(/type="submit"/g)).toHaveLength(2);
  });

  it("disables both buttons while a submission is pending", () => {
    expect(form.match(/disabled=\{pending\}/g)).toHaveLength(2);
  });

  it("labels the button that is running", () => {
    expect(form).toContain('running === "save" ? "Saving…" : "Save"');
    expect(form).toContain("Saving and analysing…");
  });

  it("is full width and stacked on mobile", () => {
    expect(form).toContain("flex-col-reverse");
    expect(form).toContain("w-full justify-center sm:w-auto");
  });

  it("keeps the resume gate", () => {
    expect(form).toContain("Upload a resume version before creating an application");
  });

  it("keeps the onboarding anchor on Save & Analyze", () => {
    expect(form).toContain('data-onboarding="save-analyze"');
  });
});

describe("card", () => {
  const feed = read("features/applications/components/saved-job-feed.tsx");
  const slot = read("features/applications/components/job-score-slot.tsx");

  it("renders the score slot through the state-aware component", () => {
    expect(feed).toContain("<JobScoreSlot");
    expect(feed).not.toContain("<ScoreRing");
    expect(feed).toContain("saveOnly={row.saveOnly}");
  });

  it("leaves the slot blank for save-only and marks a failed analysis", () => {
    expect(slot).toContain('data-score-slot="saved"');
    expect(slot).toContain('data-score-slot="failed"');
    expect(slot).toContain('aria-label="Analysis failed"');
  });

  it("selects the flag in the list query", () => {
    const repository = read("features/applications/server/application.repository.ts");

    expect(repository).toContain("saveOnly: applications.saveOnly");
  });
});

describe("drawer", () => {
  const drawer = read("features/applications/components/saved-job-drawer.tsx");
  const shell = read("features/applications/components/application-drawer.tsx");

  it("hides Analyze and Reanalyze for a save-only job", () => {
    expect(drawer).toMatch(/saveOnly \? \([\s\S]*Saved without analysis[\s\S]*<ReanalyzeButton/);
  });

  it("never treats a stored analysis as a result for a save-only job", () => {
    expect(drawer).toContain("const result = saveOnly ? null");
  });

  it("disables the AI Documents tab with a reason", () => {
    expect(drawer).toContain("documentsDisabledReason={saveOnly ? SAVE_ONLY_REASON : null}");
    expect(shell).toContain('name === "AI Documents" && documentsDisabledReason !== null');
    expect(shell).toContain("disabled={disabled}");
    expect(shell).toContain("aria-disabled");
  });

  it("keeps Reanalyze for a failed Save & Analyze", () => {
    expect(drawer).toContain("hasAnalysis={Boolean(result)}");
    expect(drawer).toContain("Use Analyze above to try again");
  });
});

describe("saved toast", () => {
  const page = read("app/(dashboard)/dashboard/jobs/page.tsx");

  it("shows Job saved, and never alongside the analysis-failed notice", () => {
    expect(page).toContain('raw.saved === "1" && raw.analysis !== "failed"');
    expect(page).toContain("<JobSavedToast />");
  });
});

describe("server-side defence", () => {
  it("document generation rejects a save-only application before looking for analysis", () => {
    const source = read("features/documents/server/document.service.ts");
    const guard = source.indexOf("row.application.saveOnly");

    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(source.indexOf("findAnalysisForApplication({"));
  });

  it("score sorting excludes rows without a score", () => {
    expect(
      read("features/applications/server/application.repository.ts"),
    ).toContain("isNotNull(applicationAnalyses.overallScore)");
  });
});

describe("copy", () => {
  it("no longer tells people Save & Analyze is the only way to save", () => {
    expect(read("features/applications/components/job-paste-dialog.tsx")).toMatch(
      /press Save or Save\s+&amp; Analyze/,
    );
    expect(read("features/onboarding/constants.ts")).toContain("or Save to keep the job without AI");
    expect(read("app/(dashboard)/dashboard/help/page.tsx")).toContain("Choose Save instead");
  });
});
