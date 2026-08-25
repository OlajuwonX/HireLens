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
    .replace(
      /&[a-z#0-9]+;/gi,
      (entity) => ENTITIES[entity.toLowerCase()] ?? entity,
    )
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

const HEADING_BLOCK = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;

export type HtmlHeading = { level: number; text: string };

export function extractHtmlHeadings(html: string): HtmlHeading[] {
  const withoutScripts = html.replace(SCRIPTS, "");
  const headings: HtmlHeading[] = [];

  for (const match of withoutScripts.matchAll(HEADING_BLOCK)) {
    const text = decodeEntities(match[2].replace(TAGS, ""))
      .replace(/\s+/g, " ")
      .trim();

    if (text && text.length <= 200) {
      headings.push({ level: Number(match[1]), text });
    }
  }

  return headings;
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
