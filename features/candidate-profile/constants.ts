export const SENIORITY_LEVELS = [
  "JUNIOR",
  "MID",
  "SENIOR",
  "LEAD",
  "PRINCIPAL",
] as const;

export type Seniority = (typeof SENIORITY_LEVELS)[number];

export const seniorityLabels: Record<Seniority, string> = {
  JUNIOR: "Junior",
  MID: "Mid-level",
  SENIOR: "Senior",
  LEAD: "Lead",
  PRINCIPAL: "Principal / Staff",
};

export const PROFILE_WORK_ARRANGEMENTS = ["REMOTE", "HYBRID", "ON_SITE"] as const;

export const SPONSORSHIP_OPTIONS = ["NO", "YES"] as const;

export const PROFILE_LIMITS = {
  listItems: 10,
  listItemLength: 80,
  shortText: 120,
  url: 300,
  maxYears: 60,
  maxNoticeWeeks: 52,
  maxSalary: 10_000_000,
} as const;

export const ANSWER_LIMITS = {
  perUser: 100,
  question: 300,
  answer: 4_000,
} as const;

export const PROFILE_SETTINGS_PATH = "/settings/profile";
