import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { InterviewConsole } from "@/features/interviews/components/interview-console";
import { InterviewPrerequisites } from "@/features/interviews/components/interview-prerequisites";
import { StartInterviewWeek } from "@/features/interviews/components/start-interview-week";
import { getInterviewEligibility } from "@/features/interviews/server/interview-eligibility.service";
import { getInterviewPageData } from "@/features/interviews/server/interview-page.service";

export const metadata: Metadata = {
  title: "Interview",
};

export const maxDuration = 60;

const DESCRIPTION =
  "Weekly interview practice tuned to your target role and seniority.";

export default async function InterviewPage() {
  const user = await requireDatabaseUser();
  const eligibility = await getInterviewEligibility(user.id);

  if (!eligibility.eligible) {
    return (
      <div className="space-y-6">
        <PageHeader title="Interview" description={DESCRIPTION} />
        <InterviewPrerequisites eligibility={eligibility} />
      </div>
    );
  }

  const data = await getInterviewPageData({ userId: user.id });

  return (
    <div className="space-y-6">
      <PageHeader title="Interview" description={DESCRIPTION} />
      {data.status === "none" ? (
        <StartInterviewWeek />
      ) : (
        <InterviewConsole data={data} />
      )}
    </div>
  );
}
