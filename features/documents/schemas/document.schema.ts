import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";
import { DOCUMENT_TYPES } from "../constants";

export const documentPublicIdSchema = z.string().uuid();

export const generateDocumentSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  jobPublicId: z.string().uuid("Select a saved job."),
  resumeVersionPublicId: z.preprocess(
    blankToUndefined,
    z.string().uuid().optional(),
  ),
  applicationPublicId: z.preprocess(
    blankToUndefined,
    z.string().uuid().optional(),
  ),
  notes: z.preprocess(
    blankToUndefined,
    z.string().trim().max(5_000).optional(),
  ),
});

export const updateDocumentSchema = z.object({
  publicId: documentPublicIdSchema,
  editedContent: z.string().trim().min(1, "Document content is required.").max(50_000),
});

export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
