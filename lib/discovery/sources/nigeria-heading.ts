const OPENINGS = /\s*[-–(]*\s*\(?\d+\s+(openings?|positions?|vacancies)\)?\s*$/i;
const MODE = /\s*[-–]?\s*\(?(hybrid|remote|on-?site)\)?\s*$/i;
const ROUNDUP = /^(jobs|vacancies)\s+at\b|\b(recruitment|vacancies|openings)\b.*\(\d+/i;

function trimTail(value: string) {
  let current = value.trim();

  for (let pass = 0; pass < 3; pass += 1) {
    const next = current.replace(OPENINGS, "").replace(MODE, "").replace(/\s*[-–]\s*$/, "").trim();

    if (next === current) {
      break;
    }

    current = next;
  }

  return current;
}

export function splitHeading(heading: string) {
  const clean = heading.replace(/\s+/g, " ").trim();

  if (!clean || ROUNDUP.test(clean)) {
    return null;
  }

  const index = clean.toLowerCase().lastIndexOf(" at ");

  if (index <= 0) {
    return null;
  }

  const title = trimTail(clean.slice(0, index));
  const company = trimTail(clean.slice(index + 4));

  return title && company ? { title, company } : null;
}

export function nigerianLocation(description: string) {
  const place = description.match(/located in ([A-Za-z ,.'-]{2,60}?)(?:\.|,? Nigeria|$)/i)?.[1]?.trim();

  return place ? `${place}, Nigeria` : "Nigeria";
}
