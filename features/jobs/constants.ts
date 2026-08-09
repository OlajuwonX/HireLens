export const WORK_ARRANGEMENTS = [
  "REMOTE",
  "HYBRID",
  "ON_SITE",
  "NOT_SPECIFIED",
] as const;

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
  "FREELANCE",
  "NOT_SPECIFIED",
] as const;

export const JOB_STATUSES = ["SAVED", "ARCHIVED"] as const;

export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];

export const workArrangementLabels: Record<WorkArrangement, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ON_SITE: "On site",
  NOT_SPECIFIED: "Not specified",
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
  FREELANCE: "Freelance",
  NOT_SPECIFIED: "Not specified",
};

export const jobStatusLabels: Record<JobStatus, string> = {
  SAVED: "Saved",
  ARCHIVED: "Archived",
};

export const JOB_SORT_OPTIONS = [
  "created_desc",
  "created_asc",
  "deadline_asc",
  "company_asc",
  "title_asc",
] as const;

export type JobSort = (typeof JOB_SORT_OPTIONS)[number];

export const jobSortLabels: Record<JobSort, string> = {
  created_desc: "Newest first",
  created_asc: "Oldest first",
  deadline_asc: "Deadline soonest",
  company_asc: "Company A–Z",
  title_asc: "Title A–Z",
};
