import "server-only";

import { createResume, findResumeForUser } from "./resume.repository";

export async function createResumeRecord(input: { userId: string; title: string }) {
  return createResume({
    userId: input.userId,
    title: input.title,
    status: "UPLOADING",
  });
}

export async function getOwnedResume(input: { userId: string; publicId: string }) {
  return findResumeForUser(input);
}
