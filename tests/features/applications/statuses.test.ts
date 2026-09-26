import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  APPLICATION_STATUSES,
  APPLICATION_TABS,
  applicationStatusLabels,
  applicationStatusTone,
  applicationTabLabels,
} from "@/features/applications/constants";
import {
  applicationFiltersSchema,
  changeStatusSchema,
  updateApplicationSchema,
} from "@/features/applications/schemas/application.schema";
import { applicationStatus } from "@/lib/db/schema";

const uuid = "8f1b1f4e-7c1a-4a5d-9a2e-2f9a5c1b3d77";

describe("status constants", () => {
  it("orders the statuses the way the UI shows them", () => {
    expect(APPLICATION_STATUSES).toEqual([
      "PENDING",
      "SHORTLISTED",
      "INTERVIEW",
      "ACCEPTED",
      "REJECTED",
    ]);
  });

  it("keeps the stored value ACCEPTED but labels it Approved", () => {
    expect(applicationStatusLabels.ACCEPTED).toBe("Approved");
    expect(APPLICATION_STATUSES).toContain("ACCEPTED");
  });

  it("labels the interview status so it does not read as the sidebar feature", () => {
    expect(applicationStatusLabels.INTERVIEW).toBe("Interviewing");
  });

  it("gives every status a label and a tone, and no extras", () => {
    expect(Object.keys(applicationStatusLabels).sort()).toEqual(
      [...APPLICATION_STATUSES].sort(),
    );
    expect(Object.keys(applicationStatusTone).sort()).toEqual(
      [...APPLICATION_STATUSES].sort(),
    );
  });

  it("keeps the five statuses visually distinct", () => {
    const tones = APPLICATION_STATUSES.map((s) => applicationStatusTone[s]);

    expect(new Set(tones).size).toBe(APPLICATION_STATUSES.length);
  });

  it("uses distinct labels so colour is never the only signal", () => {
    const labels = APPLICATION_STATUSES.map((s) => applicationStatusLabels[s]);

    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("tabs", () => {
  it("wraps the statuses in All and Archived", () => {
    expect(APPLICATION_TABS).toEqual([
      "ALL",
      ...APPLICATION_STATUSES,
      "ARCHIVED",
    ]);
  });

  it("labels every tab, including the renamed one", () => {
    for (const tab of APPLICATION_TABS) {
      expect(applicationTabLabels[tab]).toBeTruthy();
    }

    expect(applicationTabLabels.ACCEPTED).toBe("Approved");
    expect(applicationTabLabels.ALL).toBe("All");
    expect(applicationTabLabels.ARCHIVED).toBe("Archived");
  });
});

describe("schemas", () => {
  it.each(APPLICATION_STATUSES)("changeStatusSchema accepts %s", (status) => {
    expect(changeStatusSchema.safeParse({ publicId: uuid, status }).success).toBe(
      true,
    );
  });

  it.each(APPLICATION_STATUSES)("updateApplicationSchema accepts %s", (status) => {
    expect(
      updateApplicationSchema.safeParse({ publicId: uuid, status }).success,
    ).toBe(true);
  });

  it.each(["Approved", "APPROVED", "INTERVIEWING", "shortlisted", ""])(
    "rejects %j as a stored status",
    (status) => {
      expect(
        changeStatusSchema.safeParse({ publicId: uuid, status }).success,
      ).toBe(false);
    },
  );

  it.each(["SHORTLISTED", "INTERVIEW"])("filters accept the %s tab", (tab) => {
    expect(applicationFiltersSchema.parse({ tab }).tab).toBe(tab);
  });

  it("falls back to no tab for an unknown one", () => {
    expect(applicationFiltersSchema.safeParse({ tab: "OFFER" }).success).toBe(
      false,
    );
  });

  it("still defaults to Pending", () => {
    expect(applicationFiltersSchema.parse({}).tab).toBe("PENDING");
  });
});

describe("database enum", () => {
  it("matches the TypeScript list exactly, in order", () => {
    expect([...applicationStatus.enumValues]).toEqual([...APPLICATION_STATUSES]);
  });

  it("the migration only adds values before ACCEPTED", () => {
    const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as {
      entries: { tag: string }[];
    };
    const sql = readFileSync(`drizzle/${journal.entries.at(-1)?.tag}.sql`, "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    expect(statements).toEqual([
      `ALTER TYPE "public"."application_stage" ADD VALUE 'SHORTLISTED' BEFORE 'ACCEPTED';`,
      `ALTER TYPE "public"."application_stage" ADD VALUE 'INTERVIEW' BEFORE 'ACCEPTED';`,
    ]);
    expect(sql).not.toMatch(/DROP|RENAME|UPDATE|DELETE/i);
  });
});

describe("no status name is hard-coded elsewhere", () => {
  it("the dashboard says Approved", () => {
    expect(
      readFileSync("app/(dashboard)/dashboard/(overview)/page.tsx", "utf8"),
    ).toContain('label="Approved"');
  });

  it("the status select and badge read every label from the map", () => {
    expect(
      readFileSync("features/applications/components/status-select-form.tsx", "utf8"),
    ).toContain("APPLICATION_STATUSES.map");
    expect(
      readFileSync("features/applications/components/application-status-badge.tsx", "utf8"),
    ).toContain("applicationStatusLabels[status]");
  });
});

describe("status change activity", () => {
  it("titles come from the label map for every pair", async () => {
    vi.resetModules();

    const created: { title: string; description?: string | null }[][] = [];

    vi.doMock("@/features/applications/server/application.repository", () => ({
      attachAnalysisToApplication: vi.fn(),
      countApplicationsByStatus: vi.fn(),
      createJobWithApplication: vi.fn(),
      deleteApplicationForUser: vi.fn(),
      findApplicationForUser: vi.fn(),
      findApplicationRowForUser: vi.fn(),
      listActivitiesForApplication: vi.fn(),
      listApplicationsForUser: vi.fn(),
      updateApplicationWithActivity: vi.fn(),
    }));
    vi.doMock("@/features/analyses/server/analysis.service", () => ({
      analyzeApplication: vi.fn(),
    }));
    vi.doMock("@/features/analyses/server/analysis.repository", () => ({
      attachAnalysisApplication: vi.fn(),
    }));
    vi.doMock("@/features/resumes/server/resume-version.service", () => ({
      getOwnedResumeVersion: vi.fn(),
    }));

    const repository = await import(
      "@/features/applications/server/application.repository"
    );
    const { changeApplicationStatus } = await import(
      "@/features/applications/server/application.service"
    );

    for (const from of APPLICATION_STATUSES) {
      for (const to of APPLICATION_STATUSES) {
        vi.mocked(repository.findApplicationForUser).mockResolvedValue({
          publicId: uuid,
          status: from,
        } as never);
        vi.mocked(repository.updateApplicationWithActivity).mockImplementation(
          (async (input: {
            activities: { title: string; description?: string | null }[];
          }) => {
            created.push(input.activities);

            return { publicId: uuid };
          }) as never,
        );

        const before = created.length;
        const result = await changeApplicationStatus({
          userId: "user-1",
          publicId: uuid,
          status: to,
        });

        expect(result).toEqual({ ok: true, value: { publicId: uuid } });

        if (from === to) {
          expect(created.length).toBe(before);
        } else {
          expect(created[before][0]).toEqual({
            title: `Marked ${applicationStatusLabels[to]}`,
            description: `From ${applicationStatusLabels[from]}`,
          });
        }
      }
    }
  });
});
