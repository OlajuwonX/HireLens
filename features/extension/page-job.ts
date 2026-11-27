const ATS_HOSTS = /(^|\.)(greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|smartrecruiters\.com|recruitee\.com|breezy\.hr|jobvite\.com|teamtailor\.com)$/i;
const SUBDOMAIN_HOSTS = /\.(myworkdayjobs\.com|bamboohr\.com|icims\.com|recruitee\.com|breezy\.hr|teamtailor\.com)$/i;
const SKIP_SEGMENTS = new Set(["", "jobs", "job", "careers", "embed", "en", "en-us", "en-gb", "o", "j"]);

const titleCase = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function companyFromUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (SUBDOMAIN_HOSTS.test(host)) {
    return titleCase(host.split(".")[0].replace(/\d+$/, "")) || null;
  }

  if (ATS_HOSTS.test(host)) {
    const segment = url.pathname.split("/").find((part) => !SKIP_SEGMENTS.has(part.toLowerCase()));

    return segment ? titleCase(decodeURIComponent(segment)) : null;
  }

  const labels = host.split(".");

  return titleCase(labels.length > 1 ? labels[labels.length - 2] : labels[0]) || null;
}

export function describePage(input: { url: string; title: string; text: string }) {
  return [`Page title: ${input.title}`, `Page address: ${input.url}`, "", input.text].join("\n");
}
