const MIN_JOB_TEXT = 400;

export function readPageText(limit: number) {
  const text = (document.body?.innerText ?? "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  return text.slice(0, limit);
}

export function hasJobText(text: string) {
  return text.length >= MIN_JOB_TEXT;
}
