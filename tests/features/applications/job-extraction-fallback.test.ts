import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reserveUsage = vi.fn();
const completeUsage = vi.fn();
const failUsage = vi.fn();

vi.mock("@/features/usage/server/ai-usage.service", () => ({
  reserveUsage: (input: unknown) => reserveUsage(input),
  completeUsage: (input: unknown) => completeUsage(input),
  failUsage: (input: unknown) => failUsage(input),
}));

const { extractJobPosting } =
  await import("@/features/applications/server/job-extraction.service");

const COMPLETE_POSTING = `Senior Frontend Engineer

Acme Technologies · Lagos, Nigeria · Remote

About the job
We are looking for a senior engineer to lead our web platform team. You will
own the design system, mentor two engineers and drive our migration to a modern
rendering architecture. This role reports to the Head of Engineering.

Requirements
- 5+ years building production web applications
- Deep TypeScript and React experience
- Experience with design systems`;

const THIN_PASTE =
  "some text a user copied by accident that is not a job posting at all, " +
  "just a paragraph of prose with no structure whatsoever in it anywhere.";

function provider(behaviour: "ok" | "throw") {
  return {
    generateApplicationIntelligence: vi.fn(),
    extractJobPosting: vi.fn(async () => {
      if (behaviour === "throw") {
        throw new Error("provider exploded");
      }

      return {
        provider: "mock",
        model: "mock",
        rawResponse: JSON.stringify({
          title: "Senior Frontend Engineer",
          company: "Acme Technologies",
          description: "We are looking for a senior engineer.",
        }),
      };
    }),
  };
}

const ALLOWED = { ok: true as const, reservationId: "res-1" };
const EXHAUSTED = {
  ok: false as const,
  reason: "DAILY_LIMIT",
  message: "You have reached today's AI allowance for this action.",
  resetAt: new Date(),
};

beforeEach(() => {
  reserveUsage.mockReset();
  completeUsage.mockReset();
  failUsage.mockReset();
});

describe("the regex parser runs first and AI is only a fallback", () => {
  it("never calls the provider when the parser found everything", async () => {
    const ai = provider("ok");

    const result = await extractJobPosting({
      userId: "u1",
      content: COMPLETE_POSTING,
      provider: ai as never,
    });

    expect(result.ok).toBe(true);
    expect(ai.extractJobPosting).not.toHaveBeenCalled();
    expect(reserveUsage).not.toHaveBeenCalled();
  });

  it("reserves usage only when the parser left a gap", async () => {
    reserveUsage.mockResolvedValue(ALLOWED);

    await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: provider("ok") as never,
    });

    expect(reserveUsage).toHaveBeenCalledWith({
      userId: "u1",
      action: "JOB_EXTRACTION",
    });
  });
});

describe("the paste always succeeds once there is usable content", () => {
  it("degrades to the parsed result when the daily AI allowance is spent", async () => {
    reserveUsage.mockResolvedValue(EXHAUSTED);

    const result = await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: provider("ok") as never,
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.method).toBe("MANUAL");
    expect(result.ok && result.notice).toContain("allowance");
  });

  it("keeps a good parse even when the allowance is spent", async () => {
    reserveUsage.mockResolvedValue(EXHAUSTED);

    const result = await extractJobPosting({
      userId: "u1",
      content: COMPLETE_POSTING.replace("Requirements", "Notes"),
      provider: provider("ok") as never,
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.job.title).toBe("Senior Frontend Engineer");
  });

  it("degrades rather than failing when the provider throws", async () => {
    reserveUsage.mockResolvedValue(ALLOWED);

    const result = await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: provider("throw") as never,
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.method).toBe("MANUAL");
    expect(failUsage).toHaveBeenCalled();
  });

  it("does not spend the reservation when the provider throws", async () => {
    reserveUsage.mockResolvedValue(ALLOWED);

    await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: provider("throw") as never,
    });

    expect(completeUsage).not.toHaveBeenCalled();
  });
});

describe("only genuinely unusable input is refused", () => {
  it.each(["", "   ", "too short"])("refuses %o", async (content) => {
    const result = await extractJobPosting({
      userId: "u1",
      content,
      provider: provider("ok") as never,
    });

    expect(result.ok).toBe(false);
    expect(reserveUsage).not.toHaveBeenCalled();
  });
});

describe("the dialog does not report a failed read as success", () => {
  const dialog = readFileSync(
    "features/applications/components/job-paste-dialog.tsx",
    "utf8",
  );
  const action = readFileSync(
    "features/applications/actions/job-extraction-actions.ts",
    "utf8",
  );

  it("carries the method back to the client", () => {
    expect(action).toContain("method: result.method");
  });

  it("keeps the dialog open on a MANUAL result", () => {
    const manualIndex = dialog.indexOf('state.method === "MANUAL"');
    const closeIndex = dialog.indexOf("setOpen(false)", manualIndex);
    const returnIndex = dialog.indexOf("return;", manualIndex);

    expect(manualIndex).toBeGreaterThan(-1);
    expect(returnIndex).toBeLessThan(closeIndex);
  });

  it("uses an informational toast, not a success toast", () => {
    const manualIndex = dialog.indexOf('state.method === "MANUAL"');
    const block = dialog.slice(
      manualIndex,
      dialog.indexOf("return;", manualIndex),
    );

    expect(block).toContain("notify.info");
    expect(block).not.toContain("notify.success");
  });

  it("shows the reason inline so it survives the toast", () => {
    expect(dialog).toContain('role="status"');
  });
});

describe("nothing in the extraction path can crash the action", () => {
  it("degrades when the usage reservation itself throws", async () => {
    reserveUsage.mockRejectedValue(new Error("database unreachable"));

    const result = await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: provider("ok") as never,
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.method).toBe("MANUAL");
  });

  it("still returns the AI result when completeUsage throws", async () => {
    reserveUsage.mockResolvedValue(ALLOWED);
    completeUsage.mockRejectedValue(new Error("write failed"));

    const result = await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: provider("ok") as never,
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.method).toBe("ASSISTED");
    expect(result.ok && result.job.title).toBe("Senior Frontend Engineer");
  });

  it("does not rethrow when failUsage also throws", async () => {
    reserveUsage.mockResolvedValue(ALLOWED);
    failUsage.mockRejectedValue(new Error("write failed"));

    const result = await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: provider("throw") as never,
    });

    expect(result.ok).toBe(true);
  });

  it("times out a hanging provider instead of hanging the request", async () => {
    reserveUsage.mockResolvedValue(ALLOWED);

    const hanging = {
      generateApplicationIntelligence: vi.fn(),
      extractJobPosting: vi.fn(() => new Promise(() => {})),
    };

    const started = Date.now();
    const result = await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: hanging as never,
    });

    expect(result.ok).toBe(true);
    expect(Date.now() - started).toBeLessThan(20_000);
    expect(failUsage).toHaveBeenCalled();
  }, 30_000);

  it("degrades when the model returns unparseable output", async () => {
    reserveUsage.mockResolvedValue(ALLOWED);

    const garbage = {
      generateApplicationIntelligence: vi.fn(),
      extractJobPosting: vi.fn(async () => ({
        provider: "mock",
        model: "mock",
        rawResponse: "not json at all {{{",
      })),
    };

    const result = await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: garbage as never,
    });

    expect(result.ok).toBe(true);
  });

  it("survives a 60k paste without throwing", async () => {
    reserveUsage.mockResolvedValue(EXHAUSTED);

    const result = await extractJobPosting({
      userId: "u1",
      content: "Engineer at Acme. ".repeat(3_000).slice(0, 59_000),
      provider: provider("ok") as never,
    });

    expect(result.ok).toBe(true);
  }, 30_000);
});

describe("a partly malformed model reply keeps the good fields", () => {
  it("salvages title and description when salary comes back as a string", async () => {
    reserveUsage.mockResolvedValue(ALLOWED);

    const sloppy = {
      generateApplicationIntelligence: vi.fn(),
      extractJobPosting: vi.fn(async () => ({
        provider: "mock",
        model: "mock",
        rawResponse: JSON.stringify({
          title: "Backend Engineer",
          company: "Globex",
          description: "Build and run our payments platform.",
          salaryMin: "eighty thousand",
          workArrangement: "TELEPORT",
        }),
      })),
    };

    const result = await extractJobPosting({
      userId: "u1",
      content: THIN_PASTE,
      provider: sloppy as never,
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.method).toBe("ASSISTED");
    expect(result.ok && result.job.title).toBe("Backend Engineer");
    expect(result.ok && result.job.salaryMin).toBeNull();
    expect(result.ok && result.job.workArrangement).toBeNull();
  });
});
