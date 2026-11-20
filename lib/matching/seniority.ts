export const LEVELS = {
  INTERN: 0,
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
  LEAD: 4,
  PRINCIPAL: 5,
} as const;

const TITLE_LEVELS: [RegExp, number][] = [
  [/\b(intern|internship|apprentice|trainee)\b/i, LEVELS.INTERN],
  [/\b(principal|staff|distinguished|head of|director|vp|vice president)\b/i, LEVELS.PRINCIPAL],
  [/\b(lead|engineering manager|architect)\b/i, LEVELS.LEAD],
  [/\b(senior|sr\.?|iii|level 3)\b/i, LEVELS.SENIOR],
  [/\b(junior|jr\.?|graduate|entry[\s-]level|associate)\b/i, LEVELS.JUNIOR],
  [/\b(mid[\s-]?level|ii|intermediate)\b/i, LEVELS.MID],
];

export function levelFromTitle(title: string): number | null {
  return TITLE_LEVELS.find(([pattern]) => pattern.test(title))?.[1] ?? null;
}

export function levelFromSeniority(seniority: string | null): number | null {
  return seniority && seniority in LEVELS ? LEVELS[seniority as keyof typeof LEVELS] : null;
}

export const levelNames = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Principal"];
