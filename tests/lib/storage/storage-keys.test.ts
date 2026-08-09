import { describe, expect, it } from "vitest";
import { createResumeStorageKey, sanitizeFilename } from "@/lib/storage/storage-keys";

describe("sanitizeFilename", () => {
  it("strips path separators so a key cannot traverse", () => {
    expect(sanitizeFilename("../../etc/passwd")).not.toContain("/");
    expect(sanitizeFilename("..\\..\\windows\\system32")).not.toContain("\\");
  });

  it("collapses runs of unsafe characters", () => {
    expect(sanitizeFilename("my   résumé!!.pdf")).toBe("my-r-sum-.pdf");
  });

  it("falls back when every character is stripped", () => {
    expect(sanitizeFilename("///")).toBe("-");
  });

  it("truncates long names", () => {
    expect(sanitizeFilename("a".repeat(300)).length).toBeLessThanOrEqual(96);
  });
});

describe("createResumeStorageKey", () => {
  it("scopes the key to the owning user", () => {
    const key = createResumeStorageKey({
      userId: "user-1",
      filename: "resume.pdf",
    });

    expect(key.startsWith("users/user-1/resumes/")).toBe(true);
    expect(key.endsWith(".pdf")).toBe(true);
  });

  it("never collides for the same filename", () => {
    const first = createResumeStorageKey({
      userId: "user-1",
      filename: "resume.pdf",
    });
    const second = createResumeStorageKey({
      userId: "user-1",
      filename: "resume.pdf",
    });

    expect(first).not.toBe(second);
  });

  it("does not let a hostile filename escape the user prefix", () => {
    const key = createResumeStorageKey({
      userId: "user-1",
      filename: "../../../other-user/resume.pdf",
    });

    expect(key.startsWith("users/user-1/resumes/")).toBe(true);
    expect(key.split("/")).toHaveLength(5);
  });
});
