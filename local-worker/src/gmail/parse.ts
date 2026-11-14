export const MAX_TEXT = 6_000;

type Part = {
  mimeType?: string;
  body?: { data?: string };
  parts?: Part[];
  headers?: { name: string; value: string }[];
};

export type GmailMessage = {
  id: string;
  threadId?: string;
  internalDate?: string;
  payload?: Part;
};

export type ParsedEmail = {
  messageId: string;
  threadId?: string;
  from: string;
  subject: string;
  receivedAt: string;
  text: string;
};

const decode = (data: string) => Buffer.from(data, "base64url").toString("utf8");

function findPart(part: Part | undefined, mimeType: string): Part | null {
  if (!part) return null;
  if (part.mimeType === mimeType && part.body?.data) return part;

  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found) return found;
  }

  return null;
}

export function htmlToText(html: string) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

export function parseMessage(message: GmailMessage): ParsedEmail {
  const headers = message.payload?.headers ?? [];
  const header = (name: string) => headers.find((item) => item.name.toLowerCase() === name)?.value ?? "";
  const plain = findPart(message.payload, "text/plain");
  const html = plain ? null : findPart(message.payload, "text/html");
  const raw = plain?.body?.data ? decode(plain.body.data) : html?.body?.data ? htmlToText(decode(html.body.data)) : "";

  return {
    messageId: message.id,
    threadId: message.threadId,
    from: header("from"),
    subject: header("subject"),
    receivedAt: new Date(Number(message.internalDate ?? Date.now())).toISOString(),
    text: raw.replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_TEXT),
  };
}
