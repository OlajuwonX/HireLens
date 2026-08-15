import { beforeEach, describe, expect, it, vi } from "vitest";
import { IMPROVED_RESUMES_GROUP_TITLE } from "@/features/resumes/constants";

const findDocumentRowForUser = vi.fn();
const recordDocumentActivity = vi.fn();
const copyImprovedResumeToVersion = vi.fn();
const findOrCreateResumeGroupByTitle = vi.fn();

vi.mock("@/features/documents/server/document.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/documents/server/document.repository")
  >("@/features/documents/server/document.repository");

  return {
    ...actual,
    findDocumentRowForUser: (input: unknown) => findDocumentRowForUser(input),
    recordDocumentActivity: (input: unknown) => recordDocumentActivity(input),
  };
});

vi.mock("@/features/documents/server/improved-resume.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/documents/server/improved-resume.service")
  >("@/features/documents/server/improved-resume.service");

  return {
    ...actual,
    copyImprovedResumeToVersion: (input: unknown) =>
      copyImprovedResumeToVersion(input),
  };
});

vi.mock("@/features/resumes/server/resume.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/resumes/server/resume.repository")
  >("@/features/resumes/server/resume.repository");

  return {
    ...actual,
    findOrCreateResumeGroupByTitle: (input: unknown) =>
      findOrCreateResumeGroupByTitle(input),
  };
});

const { addImprovedResumeToLibrary } = await import(
  "@/features/documents/server/document.service"
);

function documentRow(resumeId: string | null) {
  return {
    document: {
      id: "doc-internal-id",
      type: "IMPROVED_RESUME",
      fileAssetId: "asset-1",
    },
    resumeId,
    jobTitle: "Frontend Engineer",
  };
}

beforeEach(() => {
  findDocumentRowForUser.mockReset();
  recordDocumentActivity.mockReset();
  copyImprovedResumeToVersion.mockReset();
  findOrCreateResumeGroupByTitle.mockReset();

  copyImprovedResumeToVersion.mockResolvedValue({ publicId: "version-1" });
  recordDocumentActivity.mockResolvedValue(undefined);
});

describe("an improved resume can still be saved after its resume group is deleted", () => {
  it("falls back to a dedicated group when the original is gone", async () => {
    findDocumentRowForUser.mockResolvedValue(documentRow(null));
    findOrCreateResumeGroupByTitle.mockResolvedValue({ id: "fallback-group" });

    const result = await addImprovedResumeToLibrary({
      userId: "u1",
      publicId: "doc-1",
    });

    expect(result.ok).toBe(true);
    expect(findOrCreateResumeGroupByTitle).toHaveBeenCalledWith({
      userId: "u1",
      title: IMPROVED_RESUMES_GROUP_TITLE,
    });
    expect(copyImprovedResumeToVersion).toHaveBeenCalledWith(
      expect.objectContaining({ resumeId: "fallback-group" }),
    );
  });

  it("still records the activity on the fallback path", async () => {
    findDocumentRowForUser.mockResolvedValue(documentRow(null));
    findOrCreateResumeGroupByTitle.mockResolvedValue({ id: "fallback-group" });

    await addImprovedResumeToLibrary({ userId: "u1", publicId: "doc-1" });

    expect(recordDocumentActivity).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "ADDED_TO_LIBRARY" }),
    );
  });

  it("uses the original group when it still exists", async () => {
    findDocumentRowForUser.mockResolvedValue(documentRow("original-group"));

    const result = await addImprovedResumeToLibrary({
      userId: "u1",
      publicId: "doc-1",
    });

    expect(result.ok).toBe(true);
    expect(findOrCreateResumeGroupByTitle).not.toHaveBeenCalled();
    expect(copyImprovedResumeToVersion).toHaveBeenCalledWith(
      expect.objectContaining({ resumeId: "original-group" }),
    );
  });

  it("never reports the old missing-group error", async () => {
    findDocumentRowForUser.mockResolvedValue(documentRow(null));
    findOrCreateResumeGroupByTitle.mockResolvedValue({ id: "fallback-group" });

    const result = await addImprovedResumeToLibrary({
      userId: "u1",
      publicId: "doc-1",
    });

    expect(JSON.stringify(result)).not.toContain("no longer exists");
  });

  it("still refuses a document that is not an improved resume", async () => {
    findDocumentRowForUser.mockResolvedValue({
      document: { id: "d", type: "COVER_LETTER", fileAssetId: null },
      resumeId: null,
      jobTitle: null,
    });

    const result = await addImprovedResumeToLibrary({
      userId: "u1",
      publicId: "doc-1",
    });

    expect(result.ok).toBe(false);
    expect(findOrCreateResumeGroupByTitle).not.toHaveBeenCalled();
  });
});
