import { defaultCommands, matchCommands } from "./command-match";
import { normalizeSearchQuery } from "@/lib/search/query";
import type { Command, SearchResponse } from "./types";

export type PaletteItem = {
  id: string;
  kind: "recent" | "command" | "resume" | "job" | "document";
  title: string;
  subtitle: string | null;
  href: string | null;
};

export type PaletteSection = {
  key: string;
  label: string;
  items: PaletteItem[];
};

function commandItem(command: Command): PaletteItem {
  return {
    id: `command:${command.id}`,
    kind: "command",
    title: command.label,
    subtitle: command.description ?? null,
    href: command.href,
  };
}

export function buildPaletteSections(input: {
  query: string;
  recents: string[];
  commands: Command[];
  response: SearchResponse;
  responseReady: boolean;
}): PaletteSection[] {
  const searching = normalizeSearchQuery(input.query) !== null;
  const sections: PaletteSection[] = [];

  if (!searching) {
    if (input.recents.length > 0) {
      sections.push({
        key: "recent",
        label: "Recent searches",
        items: input.recents.map((entry) => ({
          id: `recent:${entry.toLowerCase()}`,
          kind: "recent" as const,
          title: entry,
          subtitle: null,
          href: null,
        })),
      });
    }

    sections.push({
      key: "quick",
      label: "Quick actions",
      items: defaultCommands(input.commands).map(commandItem),
    });

    return sections.filter((section) => section.items.length > 0);
  }

  const matched = matchCommands(input.commands, input.query);

  if (matched.length > 0) {
    sections.push({
      key: "commands",
      label: "Pages and actions",
      items: matched.map(commandItem),
    });
  }

  if (input.responseReady) {
    const groups: [string, string, PaletteItem["kind"], SearchResponse["jobs"]][] = [
      ["resumes", "Resumes", "resume", input.response.resumes],
      ["jobs", "Saved jobs", "job", input.response.jobs],
      ["documents", "Documents", "document", input.response.documents],
    ];

    for (const [key, label, kind, items] of groups) {
      if (items.length > 0) {
        sections.push({
          key,
          label,
          items: items.map((item) => ({
            id: `${kind}:${item.id}`,
            kind,
            title: item.title,
            subtitle: item.subtitle,
            href: item.href,
          })),
        });
      }
    }
  }

  return sections;
}

export function flattenSections(sections: PaletteSection[]): PaletteItem[] {
  return sections.flatMap((section) => section.items);
}
