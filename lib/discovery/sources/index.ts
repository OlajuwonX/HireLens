import type { BoardAdapter, CatalogSource, DiscoverySource } from "../types";
import { arbeitnow } from "./arbeitnow";
import { ashby } from "./ashby";
import { greenhouse } from "./greenhouse";
import { himalayas } from "./himalayas";
import { jobicy } from "./jobicy";
import { lever } from "./lever";
import { hotnigerianjobs, myjobmag } from "./nigeria";
import { remotive } from "./remotive";
import { weworkremotely } from "./weworkremotely";

export const adapters: Record<CatalogSource, BoardAdapter> = {
  GREENHOUSE: greenhouse,
  LEVER: lever,
  ASHBY: ashby,
  REMOTIVE: remotive,
  JOBICY: jobicy,
  ARBEITNOW: arbeitnow,
  HIMALAYAS: himalayas,
  WEWORKREMOTELY: weworkremotely,
  MYJOBMAG: myjobmag,
  HOTNIGERIANJOBS: hotnigerianjobs,
};

const HOSTS: [RegExp, DiscoverySource][] = [
  [/(?:^|\.)greenhouse\.io$/i, "GREENHOUSE"],
  [/(?:^|\.)lever\.co$/i, "LEVER"],
  [/(?:^|\.)ashbyhq\.com$/i, "ASHBY"],
];

export function sourceFromHost(hostname: string): DiscoverySource | null {
  return HOSTS.find(([pattern]) => pattern.test(hostname))?.[1] ?? null;
}

const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const SKIP_SEGMENTS = new Set(["v1", "boards", "embed", "job_board", "posting-api", "job-board", "v0", "postings"]);

export type BoardRef = { source: DiscoverySource; token: string };

function fromUrl(value: string): BoardRef | null {
  let url: URL;

  try {
    url = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    return null;
  }

  const source = sourceFromHost(url.hostname);
  const queryToken = url.searchParams.get("for");
  const token =
    queryToken ?? url.pathname.split("/").find((part) => part && !SKIP_SEGMENTS.has(part));

  return source && token && TOKEN.test(token) ? { source, token } : null;
}

export function parseBoardInput(input: { value: string; source?: DiscoverySource }): BoardRef | null {
  const value = input.value.trim();

  if (!value) {
    return null;
  }

  const looksLikeLink = value.includes("/") || /(greenhouse\.io|lever\.co|ashbyhq\.com)/i.test(value);

  if (looksLikeLink) {
    return fromUrl(value);
  }

  return input.source && TOKEN.test(value) ? { source: input.source, token: value } : null;
}
