export type HeldDescription = { url: string; title: string; text: string; savedAt: number };

type Posting = { title: string; company: string; location: string; description: string };

const MIN_DESCRIPTION = 200;

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

const decode = (value: string) => value.replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (_, name: string) => ENTITIES[name]);

export function htmlToText(html: string) {
  return decode(
    decode(html)
      .replace(/<(br|\/p|\/li|\/h[1-6]|\/div|\/ul|\/ol)[^>]*>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const asText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const isPosting = (node: Record<string, unknown>) => {
  const type = node["@type"];

  return type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
};

function findNode(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return value.map(findNode).find(Boolean) ?? null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const node = value as Record<string, unknown>;

  return isPosting(node) ? node : findNode(node["@graph"]);
}

function placeOf(value: unknown): string {
  const first = Array.isArray(value) ? value[0] : value;
  const address = (first as { address?: Record<string, unknown> } | undefined)?.address;

  return address ? [address.addressLocality, address.addressRegion, address.addressCountry].map(asText).filter(Boolean).join(", ") : "";
}

export function readJobPosting(blocks: string[]): Posting | null {
  for (const block of blocks) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(block);
    } catch {
      continue;
    }

    const node = findNode(parsed);

    if (node) {
      return {
        title: asText(node.title),
        company: asText((node.hiringOrganization as Record<string, unknown> | undefined)?.name),
        location: placeOf(node.jobLocation),
        description: htmlToText(asText(node.description)),
      };
    }
  }

  return null;
}

export function describeHeld(posting: Posting | null, pageText: string) {
  if (!posting || posting.description.length < MIN_DESCRIPTION) {
    return pageText;
  }

  return [posting.title, posting.company, posting.location, "", posting.description].filter((line, index) => line || index === 3).join("\n");
}

export function heldLabel(held: HeldDescription, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - held.savedAt) / 60_000));
  const age = minutes < 1 ? "just now" : minutes < 60 ? `${minutes} min ago` : `${Math.round(minutes / 60)} h ago`;
  let host = "";

  try {
    host = new URL(held.url).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }

  return `${held.title || "Job description"}${host ? ` · ${host}` : ""} · saved ${age}`;
}
