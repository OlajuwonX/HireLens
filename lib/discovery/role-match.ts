const SYNONYMS: string[][] = [
  ["engineer", "developer", "programmer"],
  ["frontend", "front end"],
  ["backend", "back end"],
  ["fullstack", "full stack"],
  ["javascript", "js"],
  ["typescript", "ts"],
  ["react", "reactjs", "react js"],
  ["react native", "reactnative"],
  ["ui", "user interface"],
  ["ux", "user experience"],
  ["devops", "dev ops"],
];

const IGNORED = new Set([
  "senior", "sr", "junior", "jr", "mid", "level", "lead", "staff", "principal", "intern",
  "i", "ii", "iii", "iv", "the", "and", "of", "a", "an", "remote", "hybrid", "onsite", "role",
]);

export type RoleMatcher = string[][][];

export function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function variantsFor(term: string) {
  return SYNONYMS.find((group) => group.includes(term)) ?? [term];
}

function termsOf(role: string) {
  const normalized = normalizeTitle(role);
  const phrases = SYNONYMS.flat()
    .filter((phrase) => phrase.includes(" ") && ` ${normalized} `.includes(` ${phrase} `))
    .sort((a, b) => b.length - a.length);
  let rest = ` ${normalized} `;
  const terms: string[] = [];

  for (const phrase of phrases) {
    if (rest.includes(` ${phrase} `)) {
      terms.push(phrase);
      rest = rest.replace(` ${phrase} `, " ");
    }
  }

  return [...terms, ...rest.split(" ").filter((word) => word && !IGNORED.has(word))];
}

export function buildRoleMatcher(roles: string[]): RoleMatcher {
  const seen = new Set<string>();

  return roles
    .map((role) => termsOf(role).map(variantsFor))
    .filter((groups) => groups.length > 0)
    .filter((groups) => {
      const key = JSON.stringify(groups);

      return seen.has(key) ? false : Boolean(seen.add(key));
    });
}

export function titleMatches(matcher: RoleMatcher, title: string) {
  const padded = ` ${normalizeTitle(title)} `;

  return matcher.some((groups) => groups.every((variants) => variants.some((variant) => padded.includes(` ${variant} `))));
}
