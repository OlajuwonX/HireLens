"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { runGeneralResumeAnalysis } from "@/features/analyses/server/analysis.service";

const runAnalysisSchema = z.object({
  resumePublicId: z.string().uuid(),
  versionPublicId: z.string().uuid(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function runGeneralResumeAnalysisAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const input = runAnalysisSchema.parse({
    resumePublicId: getString(formData, "resumePublicId"),
    versionPublicId: getString(formData, "versionPublicId"),
  });

  const analysis = await runGeneralResumeAnalysis({
    userId: user.id,
    versionPublicId: input.versionPublicId,
  });

  revalidatePath(
    `/dashboard/resumes/${input.resumePublicId}/versions/${input.versionPublicId}`,
  );

  if (analysis) {
    redirect(`/dashboard/analyses/${analysis.publicId}`);
  }
}
