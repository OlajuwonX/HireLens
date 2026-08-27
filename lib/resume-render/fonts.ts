import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { StandardFonts, type PDFDocument, type PDFFont } from "pdf-lib";
import {
  RESUME_FONT_DIRECTORY,
  resumeFontFamilies,
  type ResumeFontRole,
  type ResumeTypography,
} from "@/lib/resume-design";
import type { ResumeMetrics } from "./types";

const RESUME_FONT_ROLES: ResumeFontRole[] = ["regular", "bold", "italic"];

export const RESUME_FONT_FEATURES = {
  liga: false,
  clig: false,
  dlig: false,
  rlig: false,
} as const;

const standardFallback: Record<ResumeFontRole, StandardFonts> = {
  regular: StandardFonts.Helvetica,
  bold: StandardFonts.HelveticaBold,
  italic: StandardFonts.HelveticaOblique,
};

const standardWidths: Record<ResumeFontRole, number> = {
  regular: 0.5,
  bold: 0.54,
  italic: 0.5,
};

type ParsedFont = { unitsPerEm: number; measure: (text: string) => number };

const fileCache = new Map<string, Promise<Uint8Array | null>>();
const parsedCache = new Map<string, ParsedFont | null>();

function loadFontFile(filename: string) {
  const cached = fileCache.get(filename);

  if (cached) {
    return cached;
  }

  const pending = readFile(
    path.join(process.cwd(), RESUME_FONT_DIRECTORY, filename),
  )
    .then((buffer) => new Uint8Array(buffer))
    .catch(() => {
      console.warn("Resume font file unavailable", { filename });

      return null;
    });

  fileCache.set(filename, pending);

  return pending;
}

function parseFont(filename: string, bytes: Uint8Array | null): ParsedFont | null {
  if (!bytes) {
    return null;
  }

  const cached = parsedCache.get(filename);

  if (cached !== undefined) {
    return cached;
  }

  try {
    const font = fontkit.create(bytes);
    const glyphWidths = new Map<number, number>();
    const fallbackWidth = font.unitsPerEm * 0.5;

    const widthOfCodePoint = (codePoint: number) => {
      const cached = glyphWidths.get(codePoint);

      if (cached !== undefined) {
        return cached;
      }

      let width = fallbackWidth;

      try {
        width = font.glyphForCodePoint(codePoint).advanceWidth;
      } catch {
        width = fallbackWidth;
      }

      glyphWidths.set(codePoint, width);

      return width;
    };

    const parsed: ParsedFont = {
      unitsPerEm: font.unitsPerEm,
      measure: (text) => {
        let total = 0;

        for (const character of text) {
          total += widthOfCodePoint(character.codePointAt(0) ?? 32);
        }

        return total / font.unitsPerEm;
      },
    };

    parsedCache.set(filename, parsed);

    return parsed;
  } catch {
    console.warn("Resume font could not be parsed", { filename });
    parsedCache.set(filename, null);

    return null;
  }
}

export type ResumeFontBytes = Partial<Record<ResumeFontRole, Uint8Array>>;

export type ResumeMetricsSet = ResumeMetrics & { bytes: ResumeFontBytes };

export async function loadResumeMetrics(
  typography: ResumeTypography,
): Promise<ResumeMetricsSet> {
  const family = resumeFontFamilies[typography];
  const loaded = await Promise.all(
    RESUME_FONT_ROLES.map(async (role) => {
      const filename = family.files[role];
      const bytes = await loadFontFile(filename);

      return { role, bytes, parsed: parseFont(filename, bytes) };
    }),
  );

  const parsed = new Map<ResumeFontRole, ParsedFont | null>();
  const bytes: ResumeFontBytes = {};

  for (const entry of loaded) {
    parsed.set(entry.role, entry.parsed);

    if (entry.bytes) {
      bytes[entry.role] = entry.bytes;
    }
  }

  return {
    bytes,
    widthOf: (text, size, role) => {
      if (!text) {
        return 0;
      }

      const font = parsed.get(role) ?? parsed.get("regular");

      if (!font) {
        return text.length * size * standardWidths[role];
      }

      return font.measure(text) * size;
    },
  };
}

export async function embedResumeFonts(
  doc: PDFDocument,
  typography: ResumeTypography,
  roles: ResumeFontRole[],
): Promise<Record<ResumeFontRole, PDFFont>> {
  const family = resumeFontFamilies[typography];
  const wanted = new Set(roles.length > 0 ? roles : ["regular" as const]);
  const embedded = {} as Record<ResumeFontRole, PDFFont>;
  let registered = false;

  for (const role of RESUME_FONT_ROLES) {
    if (!wanted.has(role)) {
      continue;
    }

    const bytes = await loadFontFile(family.files[role]);

    if (!bytes) {
      embedded[role] = await doc.embedFont(standardFallback[role]);
      continue;
    }

    if (!registered) {
      doc.registerFontkit(fontkit);
      registered = true;
    }

    embedded[role] = await doc.embedFont(bytes, {
      subset: true,
      features: RESUME_FONT_FEATURES,
    });
  }

  if (!embedded.regular) {
    embedded.regular = await doc.embedFont(standardFallback.regular);
  }

  return embedded;
}
