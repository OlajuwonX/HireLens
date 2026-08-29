import {
  resumeFontFamilies,
  type ResumeFontRole,
  type ResumeTypography,
} from "@/lib/resume-design";
import type { ResumeMetrics } from "./types";

type RoleWidths = {
  unitsPerEm: number;
  fallback: number;
  widths: Record<string, number>;
};

type MetricsFile = {
  typography: ResumeTypography;
  roles: Record<ResumeFontRole, RoleWidths>;
};

const cache = new Map<ResumeTypography, Promise<ResumeMetrics>>();

export function metricsUrl(typography: ResumeTypography) {
  return `/fonts/metrics-${resumeFontFamilies[typography].slug}.json`;
}

function toMetrics(file: MetricsFile): ResumeMetrics {
  const perRole = new Map<ResumeFontRole, RoleWidths>();

  for (const role of ["regular", "bold", "italic"] as ResumeFontRole[]) {
    perRole.set(role, file.roles[role]);
  }

  return {
    widthOf: (text, size, role) => {
      if (!text) {
        return 0;
      }

      const table = perRole.get(role) ?? perRole.get("regular");

      if (!table) {
        return text.length * size * 0.5;
      }

      let total = 0;

      for (const character of text) {
        const key = (character.codePointAt(0) ?? 32).toString(36);

        total += table.widths[key] ?? table.fallback;
      }

      return (total / table.unitsPerEm) * size;
    },
  };
}

export function loadClientResumeMetrics(
  typography: ResumeTypography,
  signal?: AbortSignal,
): Promise<ResumeMetrics> {
  const cached = cache.get(typography);

  if (cached) {
    return cached;
  }

  const pending = fetch(metricsUrl(typography), { signal })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Font metrics could not be loaded.");
      }

      return toMetrics((await response.json()) as MetricsFile);
    })
    .catch((error: unknown) => {
      cache.delete(typography);
      throw error;
    });

  cache.set(typography, pending);

  return pending;
}
