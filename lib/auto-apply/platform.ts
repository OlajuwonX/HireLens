import { sourceFromHost } from "@/lib/discovery/sources";
import { DISCOVERY_SOURCES, type DiscoverySource } from "@/lib/discovery/types";

export const SUPPORTED_PLATFORMS = DISCOVERY_SOURCES;

export type ApplyPlatform = DiscoverySource;

export function detectPlatform(url: string | null | undefined): ApplyPlatform | null {
  if (!url) {
    return null;
  }

  try {
    const { hostname, protocol } = new URL(url);

    return protocol === "https:" || protocol === "http:" ? sourceFromHost(hostname) : null;
  } catch {
    return null;
  }
}
