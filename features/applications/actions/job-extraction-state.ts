import type { ExtractedJob } from "@/lib/ai/schemas/job-extraction.schema";

export type JobExtractionState = {
  status: "idle" | "error" | "extracted";
  message: string;
  job: ExtractedJob | null;
};

export const initialJobExtractionState: JobExtractionState = {
  status: "idle",
  message: "",
  job: null,
};
