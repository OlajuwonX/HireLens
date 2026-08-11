const BLOCK_TAGS =
  /<\/(p|div|li|ul|ol|h[1-6]|section|article|tr|table|header|footer)>/gi;
const LINE_BREAKS = /<br\s*\/?>/gi;
const LIST_ITEMS = /<li[^>]*>/gi;
const HEADINGS = /<h[1-6][^>]*>/gi;
const SCRIPTS = /<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi;
const TAGS = /<[^>]+>/g;

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&mdash;": "-",
  "&ndash;": "-",
  "&middot;": "·",
  "&bull;": "-",
  "&hellip;": "...",
};

function decodeEntities(value: string) {
  return value
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function clipboardHtmlToText(html: string) {
  return decodeEntities(
    html
      .replace(SCRIPTS, "")
      .replace(LINE_BREAKS, "\n")
      .replace(LIST_ITEMS, "\n- ")
      .replace(HEADINGS, "\n\n")
      .replace(BLOCK_TAGS, "\n")
      .replace(TAGS, ""),
  );
}
