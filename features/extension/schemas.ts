import { z } from "zod";

export const fillRequestSchema = z.object({ url: z.url().max(4096) });

export const applicationRefSchema = z.object({ applicationPublicId: z.uuid() });

export const resumeQuerySchema = z.object({ application: z.uuid().optional() });
