import type { CatalogSource, DiscoverySource } from "@/lib/discovery/types";

export const DISCOVERY_PATH = "/dashboard/discover";

export const DISCOVERY_LIMITS = {
  followsPerUser: 30,
  pageSize: 24,
  boardsPerRun: 120,
  runBudgetMs: 240_000,
  refreshBoards: 12,
  refreshBudgetMs: 45_000,
  refreshStaleHours: 6,
  concurrency: 6,
  freshDays: 30,
  expiredRetentionDays: 30,
  upsertChunk: 100,
} as const;

export const sourceLabels: Record<CatalogSource, string> = {
  REMOTIVE: "Remotive",
  JOBICY: "Jobicy",
  ARBEITNOW: "Arbeitnow",
  HIMALAYAS: "Himalayas",
  WEWORKREMOTELY: "We Work Remotely",
  GREENHOUSE: "Greenhouse",
  LEVER: "Lever",
  ASHBY: "Ashby",
};

export const sourceHints: Record<DiscoverySource, string> = {
  GREENHOUSE: "boards.greenhouse.io/company",
  LEVER: "jobs.lever.co/company",
  ASHBY: "jobs.ashbyhq.com/company",
};
