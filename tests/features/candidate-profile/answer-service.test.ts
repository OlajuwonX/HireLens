import { beforeEach, describe, expect, it, vi } from "vitest";
import { questionKey } from "@/features/candidate-profile/schemas/answer.schema";

const mocks = vi.hoisted(() => ({
  countAnswers: vi.fn(),
  deleteAnswer: vi.fn(),
  findAnswerIdByKey: vi.fn(),
  updateAnswer: vi.fn(),
  upsertAnswer: vi.fn(),
}));

vi.mock("@/features/candidate-profile/server/answer.repository", () => mocks);

const { saveAnswer } = await import(
  "@/features/candidate-profile/server/answer.service"
);

const userId = "user-1";
const existing = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const values = { question: "Why do you want to join?", answer: "Because." };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findAnswerIdByKey.mockResolvedValue(null);
  mocks.countAnswers.mockResolvedValue(0);
  mocks.updateAnswer.mockResolvedValue(true);
});

describe("questionKey", () => {
  it("ignores case, punctuation and spacing", () => {
    expect(questionKey("  Why do you want to JOIN?! ")).toBe(
      questionKey("why do you want to join"),
    );
  });

  it("is empty for symbols only", () => {
    expect(questionKey("???")).toBe("");
  });
});

describe("saveAnswer", () => {
  it("adds a new answer under the normalized key", async () => {
    await expect(saveAnswer({ userId, values })).resolves.toEqual({
      ok: true,
      updated: false,
    });
    expect(mocks.upsertAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ userId, questionKey: "why do you want to join" }),
    );
  });

  it("updates in place when the same question is asked again", async () => {
    mocks.findAnswerIdByKey.mockResolvedValue(existing);

    await expect(saveAnswer({ userId, values })).resolves.toEqual({
      ok: true,
      updated: true,
    });
    expect(mocks.countAnswers).not.toHaveBeenCalled();
  });

  it("enforces the per-user cap for new questions only", async () => {
    mocks.countAnswers.mockResolvedValue(100);

    expect((await saveAnswer({ userId, values })).ok).toBe(false);
    expect(mocks.upsertAnswer).not.toHaveBeenCalled();
  });

  it("rejects a question made only of symbols", async () => {
    const result = await saveAnswer({
      userId,
      values: { ...values, question: "?????" },
    });

    expect(result.ok).toBe(false);
    expect(mocks.findAnswerIdByKey).not.toHaveBeenCalled();
  });

  it("edits by publicId, scoped to the user", async () => {
    await saveAnswer({ userId, values: { ...values, publicId: existing } });

    expect(mocks.updateAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ userId, publicId: existing }),
    );
    expect(mocks.upsertAnswer).not.toHaveBeenCalled();
  });

  it("refuses an edit that would collide with another saved question", async () => {
    mocks.findAnswerIdByKey.mockResolvedValue(other);

    const result = await saveAnswer({
      userId,
      values: { ...values, publicId: existing },
    });

    expect(result.ok).toBe(false);
    expect(mocks.updateAnswer).not.toHaveBeenCalled();
  });

  it("reports an edit of an answer that is gone or not owned", async () => {
    mocks.updateAnswer.mockResolvedValue(false);

    const result = await saveAnswer({
      userId,
      values: { ...values, publicId: existing },
    });

    expect(result).toEqual({ ok: false, message: "That answer no longer exists." });
  });
});
