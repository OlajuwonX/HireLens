import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saveAndAnalyze: vi.fn(),
  saveJobOnly: vi.fn(),
  redirect: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/applications/server/application.service", () => ({
  analyzeOwnedApplication: vi.fn(),
  changeApplicationStatus: vi.fn(),
  deleteOwnedApplication: vi.fn(),
  saveAndAnalyze: mocks.saveAndAnalyze,
  saveJobOnly: mocks.saveJobOnly,
  updateOwnedApplication: vi.fn(),
}));

vi.mock("@/features/applications/server/application.repository", () => ({
  setApplicationArchivedForUser: vi.fn(),
}));

vi.mock("@/features/auth/server/require-database-user", () => ({
  requireDatabaseUser: vi.fn(async () => ({ id: "user-1" })),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

const { saveAndAnalyzeAction } = await import(
  "@/features/applications/actions/application-actions"
);

const uuid = "8f1b1f4e-7c1a-4a5d-9a2e-2f9a5c1b3d77";

function form(fields: Record<string, string>) {
  const data = new FormData();

  data.set("resumeVersionPublicId", uuid);
  data.set("title", "Quantity Surveyor");
  data.set("company", "Turner");
  data.set("description", "Manage cost planning.");

  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }

  return data;
}

const idle = { status: "idle", message: "", fieldErrors: {} } as const;

async function run(data: FormData) {
  try {
    return await saveAndAnalyzeAction(idle, data);
  } catch (error) {
    return (error as Error).message;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.saveJobOnly.mockResolvedValue({
    ok: true,
    value: { applicationPublicId: "public-1" },
  });
  mocks.saveAndAnalyze.mockResolvedValue({
    ok: true,
    value: { applicationPublicId: "public-1", analysed: true },
  });
});

describe("saveAndAnalyzeAction intent routing", () => {
  it("routes intent=save to saveJobOnly and never to the analysis path", async () => {
    const outcome = await run(form({ intent: "save" }));

    expect(mocks.saveJobOnly).toHaveBeenCalledTimes(1);
    expect(mocks.saveAndAnalyze).not.toHaveBeenCalled();
    expect(outcome).toBe("NEXT_REDIRECT:/dashboard/jobs?open=public-1&saved=1");
  });

  it("routes intent=analyze to saveAndAnalyze", async () => {
    const outcome = await run(form({ intent: "analyze" }));

    expect(mocks.saveAndAnalyze).toHaveBeenCalledTimes(1);
    expect(mocks.saveJobOnly).not.toHaveBeenCalled();
    expect(outcome).toBe("NEXT_REDIRECT:/dashboard/jobs?open=public-1");
  });

  it("treats a missing intent as analyze", async () => {
    await run(form({}));

    expect(mocks.saveAndAnalyze).toHaveBeenCalledTimes(1);
    expect(mocks.saveJobOnly).not.toHaveBeenCalled();
  });

  it("rejects an unknown intent without saving anything", async () => {
    const outcome = await run(form({ intent: "drop-table" }));

    expect(outcome).toMatchObject({ status: "error" });
    expect(mocks.saveJobOnly).not.toHaveBeenCalled();
    expect(mocks.saveAndAnalyze).not.toHaveBeenCalled();
  });

  it("keeps the analysis-failed redirect for a failed Save & Analyze", async () => {
    mocks.saveAndAnalyze.mockResolvedValue({
      ok: true,
      value: {
        applicationPublicId: "public-1",
        analysed: false,
        analysisLimitReason: undefined,
      },
    });

    const outcome = await run(form({ intent: "analyze" }));

    expect(outcome).toBe(
      "NEXT_REDIRECT:/dashboard/jobs?open=public-1&analysis=failed",
    );
  });

  it("does not carry the saved flag on an analysed job", async () => {
    const outcome = await run(form({ intent: "analyze" }));

    expect(String(outcome)).not.toContain("saved=1");
  });
});

describe("saveAndAnalyzeAction validation", () => {
  it.each(["save", "analyze"])(
    "returns the same field errors for %s when the resume is missing",
    async (intent) => {
      const data = form({ intent });

      data.delete("resumeVersionPublicId");

      const outcome = await run(data);

      expect(outcome).toMatchObject({
        status: "error",
        fieldErrors: { resumeVersionPublicId: expect.any(String) },
      });
      expect(mocks.saveJobOnly).not.toHaveBeenCalled();
      expect(mocks.saveAndAnalyze).not.toHaveBeenCalled();
    },
  );

  it.each(["save", "analyze"])(
    "requires a title for %s",
    async (intent) => {
      const outcome = await run(form({ intent, title: "" }));

      expect(outcome).toMatchObject({
        status: "error",
        fieldErrors: { title: expect.any(String) },
      });
    },
  );

  it("surfaces a service failure from Save as an error, not a redirect", async () => {
    mocks.saveJobOnly.mockResolvedValue({
      ok: false,
      error: "NOT_FOUND",
      message: "That resume version could not be found.",
    });

    const outcome = await run(form({ intent: "save" }));

    expect(outcome).toMatchObject({
      status: "error",
      message: "That resume version could not be found.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("revalidates the jobs list and dashboard after a Save", async () => {
    await run(form({ intent: "save" }));

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/jobs");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
