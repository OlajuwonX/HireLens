export const DISCOVERY_SOURCES = ["GREENHOUSE", "LEVER", "ASHBY"] as const;

export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number];

export const FEED_SOURCES = ["REMOTIVE", "JOBICY", "ARBEITNOW", "HIMALAYAS", "WEWORKREMOTELY"] as const;

export type FeedSource = (typeof FEED_SOURCES)[number];

export type CatalogSource = DiscoverySource | FeedSource;

export const FEED_TOKEN = "all";

export type Arrangement = "REMOTE" | "HYBRID" | "ON_SITE" | "NOT_SPECIFIED";

export type Employment =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "TEMPORARY"
  | "FREELANCE"
  | "NOT_SPECIFIED";

export type DiscoveredPosting = {
  sourceId: string;
  title: string;
  company: string;
  location: string | null;
  workArrangement: Arrangement;
  employmentType: Employment;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  description: string;
  url: string;
  applyUrl: string | null;
  postedAt: Date | null;
};

export type BoardSnapshot = {
  companyName: string;
  postings: DiscoveredPosting[];
};

export type FetchJson = (url: string, as?: "json" | "text") => Promise<unknown>;

export type BoardAdapter = {
  source: CatalogSource;
  boardUrl: (token: string) => string;
  fetchBoard: (token: string, fetchJson: FetchJson) => Promise<BoardSnapshot>;
};
