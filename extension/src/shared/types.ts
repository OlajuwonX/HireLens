import type { Candidate } from "../../../local-worker/src/contract";

export type Connection = { origin: string; token: string; bypass: string | null };

export type MatchedApplication = { publicId: string; title: string; company: string };

export type FillData = {
  application: MatchedApplication | null;
  candidate: Candidate;
  answers: { question: string; answer: string }[];
  coverLetter: string | null;
  coverLetterPath: string | null;
  match: { score: number | null; analyzed: boolean };
  resume: { path: string; tailored: boolean };
};

export type BoostReply =
  | { ok: true; score: number | null; previousScore: number | null; finished: boolean; gaps: string[] }
  | { ok: false; limited: boolean; message: string };

export type ImportReply = { ok: true; applicationPublicId: string; created: boolean } | { ok: false; message: string };

export type Question = {
  id: string;
  label: string;
  kind: "text" | "textarea" | "select" | "radio";
  required: boolean;
  options: string[];
  maxLength: number | null;
};

export type AnswersBody = {
  url: string;
  applicationPublicId: string | null;
  pageText: string;
  questions: Question[];
};

export type AnswersReply = { ok: true; answers: { id: string; answer: string }[] } | { ok: false; limited: boolean; message: string };

export type PageJob = { url: string; title: string; text: string };

export type MatchSummary = { before: number | null; after: number | null; gaps: string[] };

export type FillSummary = {
  fields: number;
  filled: number;
  written: number;
  missing: string[];
  resumeAttached: boolean;
  coverLetterAttached: boolean;
  application: MatchedApplication | null;
  tailored: boolean;
  match: MatchSummary | null;
  notes: string[];
};

export type Request =
  | { type: "fill-data"; url: string }
  | { type: "pdf"; path: string }
  | { type: "applied"; applicationPublicId: string }
  | { type: "boost"; applicationPublicId: string }
  | { type: "import"; page: PageJob }
  | { type: "answers"; body: AnswersBody }
  | { type: "save-connection"; connection: Connection }
  | { type: "fill" }
  | { type: "ping" };

export type Reply<T> = { ok: true; value: T } | { ok: false; message: string };
