import type { Command } from "./types";

export function normalizeForMatch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenScore(command: Command, token: string) {
  const label = normalizeForMatch(command.label);
  const labelWords = label.split(" ");
  const description = normalizeForMatch(command.description ?? "");
  const keywords = command.keywords.map(normalizeForMatch);

  if (label.startsWith(token)) {
    return 100;
  }

  if (labelWords.some((word) => word.startsWith(token))) {
    return 60;
  }

  if (keywords.some((keyword) => keyword === token)) {
    return 55;
  }

  if (keywords.some((keyword) => keyword.split(" ").some((word) => word.startsWith(token)))) {
    return 45;
  }

  if (label.includes(token)) {
    return 30;
  }

  if (keywords.some((keyword) => keyword.includes(token))) {
    return 20;
  }

  if (description.includes(token)) {
    return 10;
  }

  return 0;
}

export function scoreCommand(command: Command, query: string) {
  const tokens = normalizeForMatch(query).split(" ").filter(Boolean);

  if (tokens.length === 0) {
    return 0;
  }

  let total = 0;

  for (const token of tokens) {
    const score = tokenScore(command, token);

    if (score === 0) {
      return 0;
    }

    total += score;
  }

  return total;
}

export function matchCommands(
  commands: Command[],
  query: string,
  limit = 8,
): Command[] {
  return commands
    .map((command) => ({ command, score: scoreCommand(command, query) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.command.label.localeCompare(b.command.label),
    )
    .slice(0, limit)
    .map((entry) => entry.command);
}

export function defaultCommands(commands: Command[], limit = 6): Command[] {
  const preferred = ["action-add-resume", "action-create-application", "page-jobs", "page-documents", "page-interview", "page-resumes"];
  const byId = new Map(commands.map((command) => [command.id, command]));
  const picked = preferred
    .map((id) => byId.get(id))
    .filter((command): command is Command => Boolean(command));

  return picked.slice(0, limit);
}
