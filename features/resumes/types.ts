import type { Resume } from "@/lib/db/schema";

export type ResumeLibraryItem = {
  publicId: string;
  title: string;
  status: Resume["status"];
  archivedAt: Date | null;
  createdAt: Date;
  versionCount: number;
};
