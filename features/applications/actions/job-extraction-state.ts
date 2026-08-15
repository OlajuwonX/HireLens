import type { ExtractedJob } from "@/lib/ai/schemas/job-extraction.schema";
import type { ExtractionMethod } from "../server/job-extraction.service";

export type JobExtractionState = {
  status: "idle" | "error" | "extracted";
  message: string;
  job: ExtractedJob | null;
  method: ExtractionMethod | null;
};

export const initialJobExtractionState: JobExtractionState = {
  status: "idle",
  message: "",
  job: null,
  method: null,
};
