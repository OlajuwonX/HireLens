const HOST_ALIASES: [RegExp, string][] = [
  [/^www\./, ""],
  [/^job-boards\.(eu\.)?greenhouse\.io$/, "boards.greenhouse.io"],
  [/^boards\.eu\.greenhouse\.io$/, "boards.greenhouse.io"],
];

const KEPT_PARAMS = ["gh_jid", "jobid", "job_id", "jid"];
const APPLY_SUFFIX = /\/(apply|application|applications)(\/.*)?$/;

export function pageKey(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = HOST_ALIASES.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), url.hostname.toLowerCase());
  const path = url.pathname.toLowerCase().replace(APPLY_SUFFIX, "").replace(/\/+$/, "");
  const kept = KEPT_PARAMS.flatMap((name) => {
    const param = url.searchParams.get(name);

    return param ? [`${name}=${param}`] : [];
  });

  return [`${host}${path}`, ...kept].join("?");
}

export function samePage(a: string | null | undefined, b: string | null | undefined) {
  const left = a ? pageKey(a) : null;

  return Boolean(left) && left === (b ? pageKey(b) : null);
}
