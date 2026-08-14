import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { ReportProblemForm } from "@/features/bug-reports/components/report-problem-form";

export const metadata: Metadata = {
  title: "Help",
};

const guides = [
  {
    title: "Start with a resume",
    body: "Create a resume group, then upload a PDF version to it. The default version is the one HireLens uses when you create an application.",
    href: "/dashboard/resumes",
    action: "Go to Resumes",
  },
  {
    title: "Save and analyse a job",
    body: "Paste the posting into the application form and choose a resume. One analysis produces your match scores, requirement coverage and every AI document for that job.",
    href: "/dashboard/applications",
    action: "Create an application",
  },
  {
    title: "Open your AI results",
    body: "Open a saved job and use the Analysis tab. Every result there came from the analysis already run, so opening one costs no AI usage.",
    href: "/dashboard/jobs",
    action: "Go to Saved Jobs",
  },
  {
    title: "Keep what you need",
    body: "Save any AI result to AI Documents to edit, download or keep it. An improved resume can be added back to your resume library as a new version.",
    href: "/dashboard/documents",
    action: "Go to AI Documents",
  },
];

export default async function HelpPage() {
  await requireDatabaseUser();

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Dashboard" />

      <PageHeader
        title="Help"
        description="How HireLens works, and how to tell us when something goes wrong."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-3">
          {guides.map((guide) => (
            <Card key={guide.title}>
              <CardContent className="space-y-2 p-4 sm:p-5">
                <h2 className="text-meta font-semibold text-text-primary">
                  {guide.title}
                </h2>
                <p className="text-meta leading-relaxed text-text-secondary">
                  {guide.body}
                </p>
                <Link
                  href={guide.href}
                  className="inline-block text-label font-medium text-info underline-offset-4 hover:underline"
                >
                  {guide.action}
                </Link>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="space-y-2 p-4 sm:p-5">
              <h2 className="text-meta font-semibold text-text-primary">
                Why is there a daily AI limit?
              </h2>
              <p className="text-meta leading-relaxed text-text-secondary">
                HireLens runs on a free AI allowance shared by everyone testing
                it. Each application costs one request, and opening a stored
                result costs nothing. If you reach the limit, it resets at
                midnight UTC.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-0">
          <CardHeader>
            <CardTitle>Report a problem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
            <p className="text-meta text-text-secondary">
              Tell us what happened. We capture the page you were on
              automatically — you do not need to include it.
            </p>
            <ReportProblemForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
