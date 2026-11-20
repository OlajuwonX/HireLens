import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { GeneratePrepButton } from "@/features/responses/components/generate-prep-button";
import { PrepView } from "@/features/responses/components/prep-view";
import { RESPONSES_PATH } from "@/features/responses/constants";
import { findPrepForUser } from "@/features/responses/server/prep.repository";
import { interviewPrepSchema } from "@/lib/ai/schemas/interview-prep.schema";
import type { Metadata } from "next";
import { z } from "zod";

export const metadata: Metadata = {
  title: "Interview preparation",
};

export const maxDuration = 60;

export default async function PrepPage({ params }: { params: Promise<{ prepId: string }> }) {
  const user = await requireDatabaseUser();
  const { prepId } = await params;
  const id = z.uuid().safeParse(prepId);
  const prep = id.success ? await findPrepForUser({ userId: user.id, publicId: id.data }) : null;

  if (!prep) {
    notFound();
  }

  const parsed = interviewPrepSchema.safeParse(prep.resultJson);

  return (
    <div className="space-y-6">
      <BackButton href={RESPONSES_PATH} label="Responses" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Interview preparation" description="Built from the job, your submitted resume and the employer's message." />
        <GeneratePrepButton publicId={prep.publicId} label={parsed.success ? "Regenerate" : "Prepare now"} />
      </div>

      {parsed.success ? (
        <PrepView prep={parsed.data} />
      ) : (
        <Alert tone="info">Preparation has not been generated yet. Select Prepare now.</Alert>
      )}
    </div>
  );
}
