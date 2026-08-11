import { normalizePastedText } from "@/lib/ai/normalize-pasted-text";
import type { ExtractedJob } from "@/lib/ai/schemas/job-extraction.schema";

const NAV_LINES = new Set(
  [
    "home",
    "my network",
    "jobs",
    "messaging",
    "notifications",
    "me",
    "for business",
    "try premium",
    "try premium for free",
    "see who you know",
    "apply",
    "easy apply",
    "save",
    "saved",
    "share",
    "report this job",
    "report this listing",
    "show more",
    "show less",
    "see more",
    "see less",
    "back to jobs",
    "skip to main content",
    "sign in",
    "join now",
    "about the company",
    "people you may know",
    "promoted",
    "actively hiring",
  ].map((line) => line.toLowerCase()),
);

const NOISE_PATTERNS = [
  /^\d+\s+applicants?$/i,
  /^over \d+ applicants?$/i,
  /^\d+\s+(minute|hour|day|week|month)s?\s+ago$/i,
  /^posted\s+\d+/i,
  /^·+$/,
  /^\d+ of \d+$/i,
  /^cookie/i,
  /^we use cookies/i,
];

const SOURCE_HOSTS: [RegExp, string][] = [
  [/linkedin\./i, "LinkedIn"],
  [/wellfound\.|angel\.co/i, "Wellfound"],
  [/indeed\./i, "Indeed"],
  [/glassdoor\./i, "Glassdoor"],
  [/greenhouse\.io/i, "Greenhouse"],
  [/lever\.co/i, "Lever"],
  [/workable\./i, "Workable"],
  [/ashbyhq\./i, "Ashby"],
  [/smartrecruiters\./i, "SmartRecruiters"],
  [/workday(jobs)?\./i, "Workday"],
];

const SOURCE_MARKERS: [RegExp, string][] = [
  [/\beasy apply\b|\bsee who you know\b|\blinkedin\b/i, "LinkedIn"],
  [/\bwellfound\b/i, "Wellfound"],
  [/\bindeed\b/i, "Indeed"],
  [/\bglassdoor\b/i, "Glassdoor"],
  [/\bgreenhouse\b/i, "Greenhouse"],
  [/\blever\b/i, "Lever"],
];

const EMPLOYMENT_PATTERNS: [RegExp, ExtractedJob["employmentType"]][] = [
  [/\bfull[\s-]?time\b/i, "FULL_TIME"],
  [/\bpart[\s-]?time\b/i, "PART_TIME"],
  [/\binternship\b|\bintern\b/i, "INTERNSHIP"],
  [/\btemporary\b|\btemp\b/i, "TEMPORARY"],
  [/\bfreelance\b/i, "FREELANCE"],
  [/\bcontract\b|\bcontractor\b/i, "CONTRACT"],
];

const ARRANGEMENT_PATTERNS: [RegExp, ExtractedJob["workArrangement"]][] = [
  [/\bhybrid\b/i, "HYBRID"],
  [/\bremote\b|\bwork from home\b/i, "REMOTE"],
  [/\bon[\s-]?site\b|\bonsite\b|\bin[\s-]?office\b/i, "ON_SITE"],
];

const DESCRIPTION_MARKERS =
  /^(about the job|job description|about the role|the role|role overview|overview|about this role|position summary|job summary|what you.?ll do)\s*:?\s*$/i;

const REQUIREMENT_MARKERS =
  /^(requirements?|qualifications?|what you.?ll need|what we.?re looking for|who you are|minimum qualifications?|basic qualifications?|skills? (and|&) experience|your (profile|background))\s*:?\s*$/i;

const NEXT_SECTION_MARKERS =
  /^(benefits?|perks?|what we offer|compensation|about (us|the company)|how to apply|equal opportunity|nice to have|bonus points|preferred qualifications?)\s*:?\s*$/i;

const CURRENCY_CODES = /\b(USD|GBP|EUR|NGN|CAD|AUD|INR|ZAR|KES|GHS|JPY)\b/i;
const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "USD",
  "£": "GBP",
  "€": "EUR",
  "₦": "NGN",
  "₹": "INR",
  "¥": "JPY",
};

export type ParsedJob = {
  job: Partial<ExtractedJob>;
  missing: ("title" | "company" | "description")[];
};

function isNoise(line: string) {
  const lower = line.trim().toLowerCase();

  if (!lower) {
    return true;
  }

  if (NAV_LINES.has(lower)) {
    return true;
  }

  return NOISE_PATTERNS.some((pattern) => pattern.test(lower));
}

function cleanLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !isNoise(line));
}

export function findUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s<>"')]+/);

  if (!match) {
    return null;
  }

  try {
    return new URL(match[0].replace(/[.,;]+$/, "")).toString();
  } catch {
    return null;
  }
}

export function detectSource(text: string, url: string | null) {
  if (url) {
    for (const [pattern, name] of SOURCE_HOSTS) {
      if (pattern.test(url)) {
        return name;
      }
    }
  }

  for (const [pattern, name] of SOURCE_MARKERS) {
    if (pattern.test(text)) {
      return name;
    }
  }

  return null;
}

export function detectEmploymentType(text: string) {
  for (const [pattern, value] of EMPLOYMENT_PATTERNS) {
    if (pattern.test(text)) {
      return value;
    }
  }

  return null;
}

export function detectWorkArrangement(text: string) {
  for (const [pattern, value] of ARRANGEMENT_PATTERNS) {
    if (pattern.test(text)) {
      return value;
    }
  }

  return null;
}

function toAmount(raw: string) {
  const cleaned = raw.replace(/[, ]/g, "").toLowerCase();
  const multiplier = cleaned.endsWith("k") ? 1000 : 1;
  const value = Number.parseFloat(cleaned.replace(/k$/, ""));

  return Number.isFinite(value) ? Math.round(value * multiplier) : null;
}

export function detectSalary(text: string) {
  const range = text.match(
    /([$£€₦₹¥]|\b(?:USD|GBP|EUR|NGN|CAD|AUD|INR|ZAR|KES|GHS|JPY)\b)?\s*([\d][\d,. ]*k?)\s*(?:-|–|—|to)\s*([$£€₦₹¥])?\s*([\d][\d,. ]*k?)/i,
  );

  const symbolFor = (value: string | undefined) => {
    if (!value) {
      return null;
    }

    return CURRENCY_SYMBOLS[value] ?? value.toUpperCase();
  };

  if (range) {
    const min = toAmount(range[2]);
    const max = toAmount(range[4]);
    const currency =
      symbolFor(range[1]) ??
      symbolFor(range[3]) ??
      text.match(CURRENCY_CODES)?.[0]?.toUpperCase() ??
      null;

    if (min !== null && max !== null && min >= 1000) {
      return min <= max
        ? { salaryMin: min, salaryMax: max, currency }
        : { salaryMin: max, salaryMax: min, currency };
    }
  }

  const single = text.match(
    /([$£€₦₹¥])\s*([\d][\d,. ]*k?)|\b(USD|GBP|EUR|NGN|CAD|AUD|INR|ZAR|KES|GHS|JPY)\s*([\d][\d,. ]*k?)/i,
  );

  if (single) {
    const amount = toAmount(single[2] ?? single[4] ?? "");
    const currency = symbolFor(single[1] ?? single[3]);

    if (amount !== null && amount >= 1000) {
      return { salaryMin: amount, salaryMax: amount, currency };
    }
  }

  return { salaryMin: null, salaryMax: null, currency: null };
}

function splitMetaLine(line: string) {
  return line
    .split(/\s*[·|•]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function looksLikeLocation(value: string) {
  if (/\d{3,}/.test(value)) {
    return false;
  }

  if (detectEmploymentType(value) || detectWorkArrangement(value)) {
    return false;
  }

  return /,/.test(value) || /^[A-Z][\w.' -]{1,60}$/.test(value);
}

function isSectionHeading(line: string) {
  return (
    REQUIREMENT_MARKERS.test(line) ||
    DESCRIPTION_MARKERS.test(line) ||
    NEXT_SECTION_MARKERS.test(line)
  );
}

function isCompanyCandidate(line: string) {
  if (line.length > 80 || line.endsWith(":") || isSectionHeading(line)) {
    return false;
  }

  if (line.split(/\s+/).length > 6 || /[.!?]\s|[.!?]$/.test(line)) {
    return false;
  }

  return (
    !detectEmploymentType(line) &&
    !detectWorkArrangement(line) &&
    !/^https?:/i.test(line) &&
    !/^[-*•]/.test(line)
  );
}

function sectionFrom(lines: string[], marker: RegExp) {
  const start = lines.findIndex((line) => marker.test(line));

  if (start === -1) {
    return null;
  }

  const body: string[] = [];

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (NEXT_SECTION_MARKERS.test(line) || DESCRIPTION_MARKERS.test(line)) {
      break;
    }

    body.push(line);
  }

  const text = body.join("\n").trim();

  return text || null;
}

export function parseJobPosting(input: {
  text: string;
  html?: string | null;
}): ParsedJob {
  const normalized = normalizePastedText(input.text);
  const lines = cleanLines(normalized);
  const joined = lines.join("\n");

  const sourceUrl = findUrl(input.html ?? "") ?? findUrl(normalized);
  const source = detectSource(normalized, sourceUrl);
  const salary = detectSalary(joined);

  const firstSection = lines.findIndex((line) => isSectionHeading(line));
  const headerEnd = firstSection === -1 ? 6 : Math.min(firstSection, 6);
  const header = lines.slice(0, Math.max(headerEnd, 1));
  const title = header[0] && header[0].length <= 120 ? header[0] : null;

  let company: string | null = null;
  let location: string | null = null;

  for (const line of header.slice(1)) {
    const parts = splitMetaLine(line);

    if (parts.length > 1) {
      const [first, ...rest] = parts;

      company = company ?? (first.length <= 120 ? first : null);
      location = location ?? rest.find(looksLikeLocation) ?? null;
      break;
    }
  }

  if (!company) {
    const candidate = header.slice(1).find((line) => isCompanyCandidate(line));

    company = candidate ?? null;
  }

  const requirements = sectionFrom(lines, REQUIREMENT_MARKERS);
  const describedBody = sectionFrom(lines, DESCRIPTION_MARKERS);
  const description =
    describedBody ?? (lines.length > 4 ? lines.slice(1).join("\n") : null);

  const job: Partial<ExtractedJob> = {
    title,
    company,
    location,
    workArrangement: detectWorkArrangement(header.join(" ") || normalized),
    employmentType: detectEmploymentType(header.join(" ") || normalized),
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    currency: salary.currency,
    source,
    sourceUrl,
    description,
    requirements,
  };

  const missing: ParsedJob["missing"] = [];

  if (!job.title) {
    missing.push("title");
  }

  if (!job.company) {
    missing.push("company");
  }

  if (!job.description || job.description.length < 80) {
    missing.push("description");
  }

  return { job, missing };
}
