import type { BugCategory, BugStatus } from "@/lib/db/schema";

export const BUG_CATEGORIES = [
  "BUG",
  "AI_ISSUE",
  "PERFORMANCE",
  "UPLOAD",
  "OTHER",
] as const;

export const BUG_STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED"] as const;

export const bugCategoryLabels: Record<BugCategory, string> = {
  BUG: "Something is broken",
  AI_ISSUE: "AI result was wrong",
  PERFORMANCE: "Something was slow",
  UPLOAD: "Upload or file problem",
  OTHER: "Something else",
};

export const bugStatusLabels: Record<BugStatus, string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  RESOLVED: "Resolved",
};

export const bugStatusTone: Record<BugStatus, "red" | "yellow" | "green"> = {
  OPEN: "red",
  IN_REVIEW: "yellow",
  RESOLVED: "green",
};
