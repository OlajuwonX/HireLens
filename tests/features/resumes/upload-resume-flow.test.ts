import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorageProvider } from "@/lib/storage";

const findActiveResumeByTitle = vi.fn();
const createResume = vi.fn();
const deleteResumeForUser = vi.fn();
const findResumeForUser = vi.fn();
const createResumeVersionWithFileAsset = vi.fn();

vi.mock("@/features/resumes/server/resume.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/resumes/server/resume.repository")
  >("@/features/resumes/server/resume.repository");

  return {
    ...actual,
    findActiveResumeByTitle: (input: unknown) => findActiveResumeByTitle(input),
    createResume: (input: unknown) => createResume(input),
    deleteResumeForUser: (input: unknown) => deleteResumeForUser(input),
    findResumeForUser: (input: unknown) => findResumeForUser(input),
  };
});

vi.mock("@/features/resumes/server/resume-version.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/resumes/server/resume-version.repository")
  >("@/features/resumes/server/resume-version.repository");

  return {
    ...actual,
    createResumeVersionWithFileAsset: (input: unknown) =>
      createResumeVersionWithFileAsset(input),
  };
});

const { uploadResumeToJobTitle } =
  await import("@/features/resumes/server/resume-version.service");

const uploadResume = vi.fn();
const deleteFile = vi.fn();

const storage = {
  uploadResume: (input: unknown) => uploadResume(input),
  deleteFile: (key: string) => deleteFile(key),
  createReadUrl: vi.fn(),
  readFile: vi.fn(),
} as unknown as StorageProvider;

function pdf(name: string) {
  return new File([new Uint8Array([1, 2, 3])], name, {
    type: "application/pdf",
  });
}

beforeEach(() => {
  findActiveResumeByTitle.mockReset();
  createResume.mockReset();
  deleteResumeForUser.mockReset();
  findResumeForUser.mockReset();
  createResumeVersionWithFileAsset.mockReset();
  uploadResume.mockReset();
  deleteFile.mockReset();

  findActiveResumeByTitle.mockResolvedValue(null);
  createResume.mockResolvedValue({
    id: "resume-1",
    publicId: "public-1",
    title: "Chef",
  });
  deleteResumeForUser.mockResolvedValue(undefined);
  deleteFile.mockResolvedValue(undefined);
  uploadResume.mockResolvedValue({
    provider: "memory",
    storageKey: "key-1",
    originalFilename: "Banking resume.pdf",
    mimeType: "application/pdf",
    sizeBytes: 3,
  });
  createResumeVersionWithFileAsset.mockResolvedValue({
    id: "version-1",
    label: "Banking resume",
  });
});

describe("a job title is created and the resume uploaded in one step", () => {
  it("names the version after the uploaded file", async () => {
    findResumeForUser.mockResolvedValue({
      id: "resume-1",
      publicId: "public-1",
      title: "Chef",
    });

    const result = await uploadResumeToJobTitle({
      userId: "u1",
      title: "Chef",
      file: pdf("Banking resume.pdf"),
      storageProvider: storage,
    });

    expect(result.ok).toBe(true);
    expect(createResumeVersionWithFileAsset).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Banking resume", dedupeLabel: true }),
    );
  });

  it("refuses a job title that already exists whatever the casing", async () => {
    findActiveResumeByTitle.mockResolvedValue({
      publicId: "public-9",
      title: "Product Manager",
    });

    const result = await uploadResumeToJobTitle({
      userId: "u1",
      title: "product manager",
      file: pdf("resume.pdf"),
      storageProvider: storage,
    });

    expect(result).toMatchObject({ ok: false, error: "TITLE_EXISTS" });
    expect(createResume).not.toHaveBeenCalled();
    expect(uploadResume).not.toHaveBeenCalled();
  });
});

describe("a failed upload never leaves an empty job title behind", () => {
  it("removes the job title it just created", async () => {
    findResumeForUser.mockResolvedValue({
      id: "resume-1",
      publicId: "public-1",
      title: "Chef",
    });
    createResumeVersionWithFileAsset.mockRejectedValue(new Error("db down"));

    const result = await uploadResumeToJobTitle({
      userId: "u1",
      title: "Chef",
      file: pdf("resume.pdf"),
      storageProvider: storage,
    });

    expect(result.ok).toBe(false);
    expect(deleteResumeForUser).toHaveBeenCalledWith({
      userId: "u1",
      publicId: "public-1",
    });
    expect(deleteFile).toHaveBeenCalledWith("key-1");
  });

  it("keeps a job title the user already had", async () => {
    findResumeForUser.mockResolvedValue({
      id: "resume-2",
      publicId: "public-2",
      title: "Chef",
    });
    createResumeVersionWithFileAsset.mockRejectedValue(new Error("db down"));

    const result = await uploadResumeToJobTitle({
      userId: "u1",
      resumePublicId: "public-2",
      file: pdf("resume.pdf"),
      storageProvider: storage,
    });

    expect(result.ok).toBe(false);
    expect(createResume).not.toHaveBeenCalled();
    expect(deleteResumeForUser).not.toHaveBeenCalled();
  });
});
