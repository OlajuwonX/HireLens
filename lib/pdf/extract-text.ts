import "server-only";

const MAX_RESUME_TEXT_LENGTH = 60_000;

function normalize(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t\u00A0]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfText(bytes: Uint8Array) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join("\n") : text;

  return normalize(merged ?? "").slice(0, MAX_RESUME_TEXT_LENGTH);
}

export async function readResumeText(bytes: Uint8Array) {
  try {
    const text = await extractPdfText(bytes);

    return text.length > 0 ? text : null;
  } catch (error) {
    console.error("Resume text extraction failed", {
      byteLength: bytes.byteLength,
      reason: error instanceof Error ? error.message : "unknown",
    });

    return null;
  }
}
