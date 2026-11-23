import type { Candidate } from "../../../local-worker/src/contract";

export type Connection = { origin: string; token: string; bypass: string | null };

export type MatchedApplication = { publicId: string; title: string; company: string };

export type FillData = {
  application: MatchedApplication | null;
  candidate: Candidate;
  answers: { question: string; answer: string }[];
  coverLetter: string | null;
  resume: { path: string; tailored: boolean };
};

export type FillSummary = {
  fields: number;
  filled: number;
  missing: string[];
  resumeAttached: boolean;
  application: MatchedApplication | null;
  tailored: boolean;
};

export type Request =
  | { type: "fill-data"; url: string }
  | { type: "resume"; path: string }
  | { type: "applied"; applicationPublicId: string }
  | { type: "save-connection"; connection: Connection }
  | { type: "fill" }
  | { type: "ping" };

export type Reply<T> = { ok: true; value: T } | { ok: false; message: string };
