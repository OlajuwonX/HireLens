import type { JobRegion } from "./regions";
import { FEED_SOURCES, FEED_TOKEN, type CatalogSource, type FeedSource } from "./types";

export type CatalogBoard = { source: CatalogSource; token: string; region?: JobRegion };

const NIGERIAN_FEEDS: FeedSource[] = ["MYJOBMAG", "HOTNIGERIANJOBS"];

const NIGERIAN_BOARDS: CatalogBoard[] = [
  { source: "GREENHOUSE", token: "moniepoint", region: "NG" },
  { source: "ASHBY", token: "andela", region: "NG" },
  { source: "ASHBY", token: "lemfi", region: "NG" },
];

const GREENHOUSE_BOARDS = [
  "adyen", "affirm", "airbnb", "airtable", "algolia", "anthropic", "asana", "betterment", "brex",
  "canonical", "carta", "celonis", "checkr", "chime", "cloudflare", "coinbase", "contentful",
  "databricks", "datadog", "deliveroo", "discord", "doordashusa", "dropbox", "duolingo",
  "elastic", "epicgames", "faire", "figma", "flexport", "gitlab", "gocardless", "gusto",
  "hellofresh", "instacart", "intercom", "justworks", "lyft", "mongodb", "monzo", "mozilla",
  "n26", "netlify", "nuro", "okta", "oscar", "pinterest", "reddit", "robinhood", "roblox",
  "samsara", "scaleai", "sofi", "spacex", "squarespace", "stripe", "sumup", "thoughtworks",
  "twilio", "twitch", "typeform", "upstart", "vercel", "waymo", "wikimedia", "wise", "yext",
];

const LEVER_BOARDS = [
  "binance", "cred", "outreach", "palantir", "spotify", "zoox",
];

const ASHBY_BOARDS = [
  "ashby", "clerk", "cohere", "cursor", "decagon", "elevenlabs", "harvey", "langchain", "linear",
  "modal", "notion", "openai", "perplexity", "plaid", "posthog", "ramp", "replit", "resend",
  "runway", "sierra", "snowflake", "supabase", "vanta", "zapier",
];

export const SYSTEM_BOARDS: CatalogBoard[] = [
  ...FEED_SOURCES.map((source) =>
    NIGERIAN_FEEDS.includes(source) ? { source, token: FEED_TOKEN, region: "NG" as const } : { source, token: FEED_TOKEN },
  ),
  ...GREENHOUSE_BOARDS.map((token) => ({ source: "GREENHOUSE" as const, token })),
  ...LEVER_BOARDS.map((token) => ({ source: "LEVER" as const, token })),
  ...ASHBY_BOARDS.map((token) => ({ source: "ASHBY" as const, token })),
  ...NIGERIAN_BOARDS,
];
