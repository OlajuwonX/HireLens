import { beforeEach, describe, expect, it, vi } from "vitest";

const userHasUsableResume = vi.fn();
const userHasJobContext = vi.fn();
const userHasSucceededAnalysis = vi.fn();

vi.mock("@/features/interviews/server/interview.repository", () => ({
  userHasUsableResume: (userId: string) => userHasUsableResume(userId),
  userHasJobContext: (userId: string) => userHasJobContext(userId),
  userHasSucceededAnalysis: (userId: string) =>
    userHasSucceededAnalysis(userId),
}));

const { getInterviewEligibility } = await import(
  "@/features/interviews/server/interview-eligibility.service"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getInterviewEligibility", () => {
  it("is eligible only when both a resume and job context exist", async () => {
    userHasUsableResume.mockResolvedValue(true);
    userHasJobContext.mockResolvedValue(true);
    userHasSucceededAnalysis.mockResolvedValue(false);

    await expect(getInterviewEligibility("user-1")).resolves.toEqual({
      eligible: true,
      hasResume: true,
      hasJobContext: true,
      hasAnalysis: false,
    });
  });

  it("is not eligible with a resume but no job context", async () => {
    userHasUsableResume.mockResolvedValue(true);
    userHasJobContext.mockResolvedValue(false);
    userHasSucceededAnalysis.mockResolvedValue(false);

    const result = await getInterviewEligibility("user-1");

    expect(result.eligible).toBe(false);
    expect(result.hasResume).toBe(true);
    expect(result.hasJobContext).toBe(false);
  });

  it("is not eligible with job context but no resume", async () => {
    userHasUsableResume.mockResolvedValue(false);
    userHasJobContext.mockResolvedValue(true);
    userHasSucceededAnalysis.mockResolvedValue(true);

    await expect(getInterviewEligibility("user-1")).resolves.toMatchObject({
      eligible: false,
      hasResume: false,
      hasJobContext: true,
      hasAnalysis: true,
    });
  });

  it("only runs the three prerequisite lookups, no AI", async () => {
    userHasUsableResume.mockResolvedValue(false);
    userHasJobContext.mockResolvedValue(false);
    userHasSucceededAnalysis.mockResolvedValue(false);

    await getInterviewEligibility("user-7");

    for (const lookup of [
      userHasUsableResume,
      userHasJobContext,
      userHasSucceededAnalysis,
    ]) {
      expect(lookup).toHaveBeenCalledTimes(1);
      expect(lookup).toHaveBeenCalledWith("user-7");
    }
  });
});
