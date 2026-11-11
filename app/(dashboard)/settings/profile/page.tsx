import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { AnswerBank } from "@/features/candidate-profile/components/answer-bank";
import { CompletenessCard } from "@/features/candidate-profile/components/completeness-card";
import { ProfileForm } from "@/features/candidate-profile/components/profile-form";
import { listAnswers } from "@/features/candidate-profile/server/answer.repository";
import { getCandidateProfile } from "@/features/candidate-profile/server/profile.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career profile",
};

export default async function CareerProfilePage() {
  const user = await requireDatabaseUser();
  const [{ profile, completeness }, answers] = await Promise.all([
    getCandidateProfile(user.id),
    listAnswers(user.id),
  ]);

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Dashboard" />

      <PageHeader
        title="Career profile"
        description="The facts HireLens uses to match you with jobs and fill in applications. Only you can see them."
      />

      <CompletenessCard completeness={completeness} />

      <ProfileForm profile={profile} />

      <AnswerBank answers={answers} />
    </div>
  );
}
