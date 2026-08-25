import { normalizePastedText } from "@/lib/ai/normalize-pasted-text";
import type { ExtractedJob } from "@/lib/ai/schemas/job-extraction.schema";
import { extractHtmlHeadings } from "./clipboard-html";

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
    "represents the skills you have",
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
  /^\d{1,3}%/,
  /\d{1,3}%$/,
  /^find out how your skills align/i,
  /^https?:\/\/\S+$/i,
];

const POSTED_AGO =
  /^(posted\s+)?\d+\s*(m|h|d|w|mo|minute|hour|day|week|month|year)s?\s+ago$/i;

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
  [/pinpointhq\./i, "Pinpoint"],
  [/teamtailor\./i, "Teamtailor"],
  [/bamboohr\./i, "BambooHR"],
  [/recruitee\./i, "Recruitee"],
  [/personio\./i, "Personio"],
  [/jobvite\./i, "Jobvite"],
  [/icims\./i, "iCIMS"],
  [/jobright\./i, "JobRight"],
];

const SOURCE_MARKERS: [RegExp, string][] = [
  [/\beasy apply\b|\bsee who you know\b|\blinkedin\b/i, "LinkedIn"],
  [/\bwellfound\b/i, "Wellfound"],
  [/\bindeed\b/i, "Indeed"],
  [/\bglassdoor\b/i, "Glassdoor"],
  [/\bgreenhouse\b/i, "Greenhouse"],
  [/\blever\b/i, "Lever"],
  [/\bjobright\b/i, "JobRight"],
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

const SENIORITY_LINE =
  /^(entry|junior|mid|senior|staff|principal|lead|associate|executive|director|graduate|intern)([\s-]?level)?$/i;

const EXPERIENCE_LINE = /^\d+\+?\s*(years?|yrs?)\b/i;

const DESCRIPTION_MARKERS =
  /^(about the job|job description|about the role|the role|role overview|overview|about this role|position summary|job summary)\s*:?\s*$/i;

const REQUIREMENT_MARKERS =
  /^(requirements?|qualifications?|required|preferred|what you.?ll need|what we.?re looking for|who you are|minimum qualifications?|basic qualifications?|preferred qualifications?|nice to have|bonus points|skills? (and|&) experience|your (profile|background))\s*:?\s*$/i;

const RESPONSIBILITY_MARKERS =
  /^(responsibilities|key responsibilities|what you.?ll do|duties|the job|your role)\s*:?\s*$/i;

const NEXT_SECTION_MARKERS =
  /^(benefits?|perks?|what we offer|compensation|about (us|the company)|how to apply|equal opportunity|our values|why join)\s*:?\s*$/i;

const CURRENCY_CODES = /\b(USD|GBP|EUR|NGN|CAD|AUD|INR|ZAR|KES|GHS|JPY)\b/i;
const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "USD",
  "£": "GBP",
  "€": "EUR",
  "₦": "NGN",
  "₹": "INR",
  "¥": "JPY",
};

const AMOUNT = String.raw`[\d][\d,. ]*k?`;
const UNIT = String.raw`(?:\s*(?:\/|per\s+|a\s+)\s*(?:yr|year|annum|hr|hour|mo|month|wk|week))?`;
const SYMBOL = String.raw`[$£€₦₹¥]`;
const CODE = String.raw`\b(?:USD|GBP|EUR|NGN|CAD|AUD|INR|ZAR|KES|GHS|JPY)\b`;

export type JobLayout = "TITLE_FIRST" | "COMPANY_FIRST";

export type ParsedJob = {
  job: Partial<ExtractedJob>;
  missing: ("title" | "company" | "description")[];
  layout: JobLayout;
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

  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    return Number.parseInt(cleaned.replace(/\./g, ""), 10);
  }

  const multiplier = cleaned.endsWith("k") ? 1000 : 1;
  const value = Number.parseFloat(cleaned.replace(/k$/, ""));

  return Number.isFinite(value) ? Math.round(value * multiplier) : null;
}

export function detectSalary(text: string) {
  const range = text.match(
    new RegExp(
      `(${SYMBOL}|${CODE})?\\s*(${AMOUNT})${UNIT}\\s*(?:-|–|—|to)\\s*(${SYMBOL})?\\s*(${AMOUNT})${UNIT}`,
      "i",
    ),
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
    new RegExp(`(${SYMBOL})\\s*(${AMOUNT})|(${CODE})\\s*(${AMOUNT})`, "i"),
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

function isMetadataLine(value: string) {
  return Boolean(
    detectEmploymentType(value) ||
      detectWorkArrangement(value) ||
      SENIORITY_LINE.test(value) ||
      EXPERIENCE_LINE.test(value),
  );
}

function looksLikeLocation(value: string) {
  if (/\d{3,}/.test(value) || isMetadataLine(value)) {
    return false;
  }

  return /,/.test(value) || /^[A-Z][\w.' -]{1,60}$/.test(value);
}

function isSectionHeading(line: string) {
  return (
    REQUIREMENT_MARKERS.test(line) ||
    RESPONSIBILITY_MARKERS.test(line) ||
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
    !isMetadataLine(line) &&
    !/^https?:/i.test(line) &&
    !/^[-*•]/.test(line)
  );
}

function detectLayout(header: string[]) {
  const parts = splitMetaLine(header[0] ?? "");

  if (parts.length > 1 && parts.slice(1).some((part) => POSTED_AGO.test(part))) {
    return "COMPANY_FIRST" as const;
  }

  return "TITLE_FIRST" as const;
}

function titleFromHeadings(html: string | null | undefined, header: string[]) {
  if (!html) {
    return null;
  }

  const headings = extractHtmlHeadings(html).filter(
    (heading) => !isSectionHeading(heading.text) && !isNoise(heading.text),
  );

  if (headings.length === 0) {
    return null;
  }

  const best = [...headings].sort((a, b) => a.level - b.level)[0];
  const normalizedHeader = header.map((line) => line.toLowerCase());

  return normalizedHeader.includes(best.text.toLowerCase()) ? best.text : null;
}

const CHIP_MAX_WORDS = 4;
const CHIP_SECTION_RATIO = 0.6;

function isListItem(line: string) {
  return /^[-*•]|^\d+[.)]\s/.test(line);
}

export function isChipLine(line: string) {
  return (
    !/[.!?]/.test(line) &&
    !isListItem(line) &&
    line.split(/\s+/).length <= CHIP_MAX_WORDS
  );
}

export function isChipSection(lines: string[]) {
  if (lines.length < 2) {
    return false;
  }

  return lines.filter(isChipLine).length / lines.length >= CHIP_SECTION_RATIO;
}

function stripBullet(line: string) {
  return line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
}

type Section = { heading: string | null; lines: string[] };

function collectSections(lines: string[]) {
  const description: Section = { heading: null, lines: [] };
  const requirements: Section[] = [];

  let target: Section | null = description;
  let descriptionMarked = false;

  for (const line of lines) {
    if (DESCRIPTION_MARKERS.test(line)) {
      target = description;
      descriptionMarked = true;
      continue;
    }

    if (REQUIREMENT_MARKERS.test(line) || RESPONSIBILITY_MARKERS.test(line)) {
      const section: Section = { heading: line.replace(/\s*:\s*$/, ""), lines: [] };

      requirements.push(section);
      target = section;
      continue;
    }

    if (NEXT_SECTION_MARKERS.test(line)) {
      target = null;
      continue;
    }

    target?.lines.push(line);
  }

  return { description, requirements, descriptionMarked };
}

function formatSectionBody(lines: string[]) {
  if (lines.length === 0) {
    return "";
  }

  if (isChipSection(lines)) {
    return `${lines.map(stripBullet).join(", ")}.`;
  }

  return lines
    .map((line, index) => `${index + 1}. ${stripBullet(line)}`)
    .join("\n");
}

function formatRequirements(sections: Section[]) {
  const blocks = sections
    .map((section) => {
      const body = formatSectionBody(section.lines);

      if (!section.heading) {
        return body;
      }

      return body ? `${section.heading}\n\n${body}` : null;
    })
    .filter((block): block is string => Boolean(block));

  return blocks.join("\n\n") || null;
}

function formatDescription(input: { headline: string[]; lines: string[] }) {
  const blocks: string[] = [];
  const headline = input.headline.filter(Boolean).join(" · ");

  if (headline) {
    blocks.push(headline);
  }

  let run: string[] = [];

  const flush = () => {
    if (run.length === 0) {
      return;
    }

    blocks.push(
      isChipSection(run) ? `${run.join(", ")}.` : run.join("\n"),
    );
    run = [];
  };

  for (const line of input.lines) {
    if (run.length > 0 && isChipLine(line) !== isChipLine(run[run.length - 1])) {
      flush();
    }

    run.push(line);
  }

  flush();

  return blocks.join("\n\n").trim() || null;
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
  const headerEnd = firstSection === -1 ? 8 : Math.min(firstSection, 8);
  const header = lines.slice(0, Math.max(headerEnd, 1));
  const layout = detectLayout(header);

  let title: string | null = null;
  let company: string | null = null;
  let location: string | null = null;
  let consumed = 0;

  const headingTitle = titleFromHeadings(input.html, header);

  if (layout === "COMPANY_FIRST") {
    const [first] = splitMetaLine(header[0]);

    company = first && first.length <= 120 ? first : null;

    const titleIndex = header.findIndex(
      (line, index) =>
        index > 0 &&
        !isMetadataLine(line) &&
        line.length <= 120 &&
        (!headingTitle || line === headingTitle),
    );

    if (titleIndex !== -1) {
      title = header[titleIndex];
      consumed = titleIndex;
    }
  } else {
    title =
      headingTitle ?? (header[0] && header[0].length <= 120 ? header[0] : null);

    const rest = header.filter((line) => line !== title);

    for (const line of rest) {
      const parts = splitMetaLine(line);

      if (parts.length > 1) {
        const [head, ...tail] = parts;

        company = company ?? (head.length <= 120 ? head : null);
        location = location ?? tail.find(looksLikeLocation) ?? null;
        break;
      }
    }

    if (!company) {
      company = rest.find(isCompanyCandidate) ?? null;
    }
  }

  if (!location) {
    location =
      header
        .slice(consumed + 1)
        .find((line) => line !== title && line !== company && looksLikeLocation(line)) ??
      null;
  }

  const sections = collectSections(lines);
  const headerText = header.join(" ") || normalized;

  const headline = [
    title,
    header.find((line) => SENIORITY_LINE.test(line)) ?? "",
    header.find((line) => EXPERIENCE_LINE.test(line)) ?? "",
  ].filter((value): value is string => Boolean(value));

  const body = sections.description.lines.filter(
    (line) =>
      line !== title &&
      line !== company &&
      line !== location &&
      !isMetadataLine(line) &&
      !splitMetaLine(line).some((part) => POSTED_AGO.test(part)),
  );

  const identified =
    sections.descriptionMarked ||
    Boolean(title) ||
    Boolean(company) ||
    sections.requirements.length > 0;

  const description = identified
    ? formatDescription({ headline, lines: body })
    : null;

  const job: Partial<ExtractedJob> = {
    title,
    company,
    location,
    workArrangement: detectWorkArrangement(headerText),
    employmentType: detectEmploymentType(headerText),
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    currency: salary.currency,
    source,
    sourceUrl,
    description,
    requirements: formatRequirements(sections.requirements),
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

  return { job, missing, layout };
}
