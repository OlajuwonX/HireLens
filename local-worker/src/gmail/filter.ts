import type { ParsedEmail } from "./parse";

export type WatchList = { terms: string[]; domains: string[] };

const normalize = (value: string) => ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

export function senderDomain(from: string) {
  return from.match(/@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1]?.toLowerCase() ?? "";
}

export function isRelevant(email: ParsedEmail, watch: WatchList) {
  const domain = senderDomain(email.from);

  if (watch.domains.some((ats) => domain === ats || domain.endsWith(`.${ats}`))) {
    return true;
  }

  const squashedDomain = domain.replace(/[^a-z0-9]/g, "");
  const content = normalize(`${email.from} ${email.subject} ${email.text.slice(0, 1_500)}`);

  return watch.terms.some((term) => {
    const squashed = term.replace(/\s+/g, "");

    return (squashed.length > 2 && squashedDomain.includes(squashed)) || content.includes(normalize(term));
  });
}
