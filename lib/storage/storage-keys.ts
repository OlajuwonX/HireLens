const unsafeFilenamePattern = /[^a-zA-Z0-9._-]/g;

export function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .trim()
    .replace(unsafeFilenamePattern, "-")
    .replace(/-+/g, "-")
    .slice(0, 96);

  return sanitized || "resume.pdf";
}

export function createResumeStorageKey(input: {
  userId: string;
  filename: string;
  extension?: string;
}) {
  const extension = input.extension ?? "pdf";
  const safeFilename = sanitizeFilename(input.filename).replace(/\.[^.]+$/, "");
  const randomId = crypto.randomUUID();

  return `users/${input.userId}/resumes/${randomId}/${safeFilename}.${extension}`;
}
