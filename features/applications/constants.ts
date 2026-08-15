export const APPLICATION_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const applicationStatusTone: Record<
  ApplicationStatus,
  "neutral" | "green" | "yellow" | "red" | "blue"
> = {
  PENDING: "yellow",
  ACCEPTED: "green",
  REJECTED: "red",
};

export const APPLICATION_TABS = [
  "ALL",
  ...APPLICATION_STATUSES,
  "ARCHIVED",
] as const;

export type ApplicationTab = (typeof APPLICATION_TABS)[number];

export const applicationTabLabels: Record<ApplicationTab, string> = {
  ALL: "All",
  ...applicationStatusLabels,
  ARCHIVED: "Archived",
};

export const APPLICATION_SORT_OPTIONS = [
  "activity_desc",
  "created_desc",
  "deadline_asc",
  "score_desc",
  "company_asc",
] as const;

export type ApplicationSort = (typeof APPLICATION_SORT_OPTIONS)[number];

export const applicationSortLabels: Record<ApplicationSort, string> = {
  activity_desc: "Recent activity",
  created_desc: "Newest first",
  deadline_asc: "Deadline soonest",
  score_desc: "Best match",
  company_asc: "Company A–Z",
};
