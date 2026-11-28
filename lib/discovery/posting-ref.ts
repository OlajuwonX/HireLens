import { sourceFromHost } from "./sources";
import type { DiscoverySource } from "./types";

export type PostingRef = { source: DiscoverySource; token: string; jobId: string };

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

function segments(url: URL) {
  return url.pathname.split("/").filter(Boolean);
}

function greenhouseRef(url: URL) {
  const parts = segments(url);
  const token = url.searchParams.get("for") ?? (parts[0] === "embed" ? null : parts[0]);
  const jobId = url.searchParams.get("token") ?? (parts[1] === "jobs" ? parts[2] : null);

  return { token, jobId };
}

export function postingRefFromUrl(value: string): PostingRef | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const source = sourceFromHost(url.hostname);

  if (!source) {
    return null;
  }

  const [first, second] = segments(url);
  const { token, jobId } = source === "GREENHOUSE" ? greenhouseRef(url) : { token: first, jobId: second };

  return token && jobId && SEGMENT.test(token) && SEGMENT.test(jobId) ? { source, token, jobId } : null;
}
