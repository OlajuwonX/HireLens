export type CommandGroup = "pages" | "actions" | "account" | "admin";

export type Command = {
  id: string;
  label: string;
  description?: string;
  keywords: string[];
  href: string;
  group: CommandGroup;
};

export type SearchResultKind = "resume" | "job" | "document";

export type SearchResultItem = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string | null;
  href: string;
};

export type SearchResponse = {
  resumes: SearchResultItem[];
  jobs: SearchResultItem[];
  documents: SearchResultItem[];
};

export const EMPTY_SEARCH_RESPONSE: SearchResponse = {
  resumes: [],
  jobs: [],
  documents: [],
};
