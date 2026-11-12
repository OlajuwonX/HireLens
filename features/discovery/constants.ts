import type { DiscoverySource } from "@/lib/discovery/types";

export const DISCOVERY_PATH = "/dashboard/discover";

export const DISCOVERY_LIMITS = {
  followsPerUser: 30,
  pageSize: 24,
  boardsPerRun: 25,
  runBudgetMs: 45_000,
  expiredRetentionDays: 30,
  upsertChunk: 100,
} as const;

export const sourceLabels: Record<DiscoverySource, string> = {
  GREENHOUSE: "Greenhouse",
  LEVER: "Lever",
  ASHBY: "Ashby",
};

export const sourceHints: Record<DiscoverySource, string> = {
  GREENHOUSE: "boards.greenhouse.io/company",
  LEVER: "jobs.lever.co/company",
  ASHBY: "jobs.ashbyhq.com/company",
};
