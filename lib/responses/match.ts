export const ATS_MAIL_DOMAINS = [
  "greenhouse.io",
  "greenhouse-mail.io",
  "lever.co",
  "hire.lever.co",
  "ashbyhq.com",
  "workablemail.com",
  "smartrecruiters.com",
  "myworkday.com",
];

export const MATCH_THRESHOLD = 50;

export type ApplicationCandidate = { id: string; company: string; title: string };

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const companyCore = (company: string) =>
  normalize(company)
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|co|gmbh|plc|group|technologies|technology|labs)\b/g, "")
    .trim();

export function senderDomain(from: string) {
  return from.match(/@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1]?.toLowerCase() ?? "";
}

export function isAtsDomain(domain: string) {
  return ATS_MAIL_DOMAINS.some((ats) => domain === ats || domain.endsWith(`.${ats}`));
}

function score(email: { domain: string; content: string }, candidate: ApplicationCandidate) {
  const core = companyCore(candidate.company);

  if (!core) {
    return 0;
  }

  const squashed = core.replace(/\s+/g, "");
  const viaJobBoard = isAtsDomain(email.domain);
  const domainHit = !viaJobBoard && email.domain.replace(/[^a-z0-9]/g, "").includes(squashed);
  const nameHit = ` ${email.content} `.includes(` ${core} `);
  const titleHit = normalize(candidate.title).length > 3 && email.content.includes(normalize(candidate.title));
  const jobBoardBonus = viaJobBoard && nameHit ? 20 : 0;

  return (domainHit ? 60 : 0) + (nameHit ? 35 : 0) + (titleHit ? 25 : 0) + jobBoardBonus;
}

export function matchApplication(
  email: { from: string; subject: string; text: string },
  candidates: ApplicationCandidate[],
) {
  const target = { domain: senderDomain(email.from), content: normalize(`${email.subject} ${email.text}`) };
  const ranked = candidates
    .map((candidate) => ({ candidate, score: Math.min(100, score(target, candidate)) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];

  if (!best || best.score < MATCH_THRESHOLD) {
    return null;
  }

  const tied = ranked.filter((entry) => entry.score === best.score);

  return tied.length === 1 || tied.every((entry) => companyCore(entry.candidate.company) === companyCore(best.candidate.company))
    ? { applicationId: best.candidate.id, score: best.score }
    : null;
}

export function watchTerms(candidates: ApplicationCandidate[]) {
  return [...new Set(candidates.map((candidate) => companyCore(candidate.company)).filter((core) => core.length > 1))];
}
