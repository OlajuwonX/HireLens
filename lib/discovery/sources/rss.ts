export function rssTag(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  const value = match?.[1]?.trim() ?? "";

  return value.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1").trim();
}

export function parseRssItems(xml: unknown) {
  return typeof xml === "string" ? [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]) : [];
}
