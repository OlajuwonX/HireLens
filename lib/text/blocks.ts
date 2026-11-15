export type TextBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

const BULLET = /^\s*(?:[-•*▪●◦‣–]|\d{1,2}[.)])\s+/;
const HEADING_MAX_WORDS = 8;
const LEAD_IN_MAX_WORDS = 4;

function isHeading(lines: string[]) {
  const [line] = lines;
  const words = line.split(/\s+/).length;

  return (
    lines.length === 1 &&
    words <= (line.endsWith(":") ? LEAD_IN_MAX_WORDS : HEADING_MAX_WORDS) &&
    !/[.,;!?]$/.test(line) &&
    !BULLET.test(line)
  );
}

function splitBlock(lines: string[]): TextBlock[] {
  if (isHeading(lines)) {
    return [{ kind: "heading", text: lines[0].replace(/:$/, "") }];
  }

  const blocks: TextBlock[] = [];

  for (const line of lines) {
    const last = blocks.at(-1);

    if (BULLET.test(line)) {
      const item = line.replace(BULLET, "").trim();

      if (last?.kind === "list") {
        last.items.push(item);
      } else if (item) {
        blocks.push({ kind: "list", items: [item] });
      }
    } else if (last?.kind === "paragraph") {
      last.text = `${last.text} ${line}`;
    } else {
      blocks.push({ kind: "paragraph", text: line });
    }
  }

  return blocks;
}

function mergeLists(blocks: TextBlock[]) {
  return blocks.reduce<TextBlock[]>((merged, block) => {
    const last = merged.at(-1);

    if (block.kind === "list" && last?.kind === "list") {
      last.items.push(...block.items);
    } else {
      merged.push(block);
    }

    return merged;
  }, []);
}

export function toTextBlocks(text: string): TextBlock[] {
  return mergeLists(
    text
      .split(/\n\s*\n/)
      .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
      .filter((lines) => lines.length > 0)
      .flatMap(splitBlock),
  );
}
