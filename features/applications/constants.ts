export const APPLICATION_STAGES = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const applicationStageLabels: Record<ApplicationStage, string> = {
  SAVED: "Saved",
  PREPARING: "Preparing",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const PIPELINE_STAGES: ApplicationStage[] = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
];

export const CLOSED_STAGES: ApplicationStage[] = ["REJECTED", "WITHDRAWN"];

export const applicationStageTone: Record<
  ApplicationStage,
  "neutral" | "green" | "yellow" | "red" | "blue"
> = {
  SAVED: "neutral",
  PREPARING: "neutral",
  APPLIED: "blue",
  INTERVIEW: "yellow",
  OFFER: "green",
  REJECTED: "red",
  WITHDRAWN: "neutral",
};

export const APPLICATION_SORT_OPTIONS = [
  "activity_desc",
  "created_desc",
  "followup_asc",
  "company_asc",
] as const;

export type ApplicationSort = (typeof APPLICATION_SORT_OPTIONS)[number];

export const applicationSortLabels: Record<ApplicationSort, string> = {
  activity_desc: "Recent activity",
  created_desc: "Newest first",
  followup_asc: "Follow-up soonest",
  company_asc: "Company A–Z",
};
