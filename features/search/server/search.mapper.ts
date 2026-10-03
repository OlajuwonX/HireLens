import { documentTypeLabels } from "@/features/documents/constants";
import { normalizeForMatch } from "../command-match";
import type { SearchResponse } from "../types";

type ResumeRow = { publicId: string; title: string };

type JobRow = {
  publicId: string;
  title: string;
  company: string;
  location: string | null;
};

type DocumentRow = {
  publicId: string;
  type: string;
  jobTitle: string | null;
  jobCompany: string | null;
};

export function documentTypeLabel(type: string) {
  return (
    documentTypeLabels[type] ??
    type
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((word) => word[0]!.toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function matchingDocumentTypes<T extends string>(
  query: string,
  enumValues: readonly T[],
): T[] {
  const needle = normalizeForMatch(query);

  if (!needle) {
    return [];
  }

  return enumValues.filter((value) => {
    const label = normalizeForMatch(documentTypeLabel(value));
    const key = normalizeForMatch(value.replace(/_/g, " "));

    return label.includes(needle) || key.includes(needle);
  });
}

export function mapSearchResults(rows: {
  resumes: ResumeRow[];
  jobs: JobRow[];
  documents: DocumentRow[];
}): SearchResponse {
  return {
    resumes: rows.resumes.map((row) => ({
      id: row.publicId,
      kind: "resume" as const,
      title: row.title,
      subtitle: "Resume",
      href: `/dashboard/resumes/${row.publicId}`,
    })),
    jobs: rows.jobs.map((row) => ({
      id: row.publicId,
      kind: "job" as const,
      title: row.title,
      subtitle: row.location ? `${row.company} · ${row.location}` : row.company,
      href: `/dashboard/jobs?open=${row.publicId}`,
    })),
    documents: rows.documents.map((row) => ({
      id: row.publicId,
      kind: "document" as const,
      title: documentTypeLabel(row.type),
      subtitle:
        row.jobTitle && row.jobCompany
          ? `${row.jobTitle} · ${row.jobCompany}`
          : (row.jobTitle ?? row.jobCompany ?? "No linked job"),
      href: `/dashboard/documents/${row.publicId}`,
    })),
  };
}
