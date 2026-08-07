import "server-only";

import {
  archiveResumeForUser,
  createResume,
  deleteResumeForUser,
  findResumeForUser,
  listResumesForUser,
  renameResumeForUser,
  retryResumeProcessingForUser,
} from "./resume.repository";

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

export async function getResumeLibrary(userId: string) {
  return listResumesForUser(userId);
}

export async function renameOwnedResume(input: {
  userId: string;
  publicId: string;
  title: string;
}) {
  return renameResumeForUser(input);
}

export async function archiveOwnedResume(input: { userId: string; publicId: string }) {
  return archiveResumeForUser(input);
}

export async function deleteOwnedResume(input: { userId: string; publicId: string }) {
  return deleteResumeForUser(input);
}

export async function retryOwnedResumeProcessing(input: {
  userId: string;
  publicId: string;
}) {
  return retryResumeProcessingForUser(input);
}
