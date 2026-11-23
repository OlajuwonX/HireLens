import { Suspense } from "react";
import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { ConnectExtension } from "@/features/extension/components/connect-extension";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browser extension",
};

const installSteps = [
  "In the HireLens folder, run: cd extension, then pnpm install --ignore-workspace, then pnpm build.",
  "Open brave://extensions (or chrome://extensions, or edge://extensions).",
  "Turn on Developer mode, select Load unpacked, and choose the extension/dist folder.",
  "Pin HireLens to the toolbar, open it, enter this site's address and select Connect.",
];

const useSteps = [
  "Open a job's application page. Apply with HireLens in Discover opens it for you.",
  "Open the HireLens extension and select Fill this page. Your details, saved answers and resume are filled in.",
  "If your resume matches the job below 85%, it is improved first, aiming for 90% without adding anything untrue.",
  "Open questions and cover letters are written by AI and outlined in blue. Read and edit them.",
  "On forms with several pages, select Next yourself: each new page fills in automatically.",
  "Check every field, finish anything outlined in orange, and submit yourself. Then select I submitted in the extension.",
];

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 text-meta text-text-secondary">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

export default async function ExtensionSettingsPage() {
  await requireDatabaseUser();

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Dashboard" />

      <PageHeader
        title="Browser extension"
        description="Fill job applications in your own browser with your profile, saved answers and best resume. Works in Brave, Chrome and Edge. Free."
      />

      <Card>
        <CardHeader>
          <CardTitle>Connect</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <ConnectExtension />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Install</CardTitle>
        </CardHeader>
        <CardContent>
          <Steps steps={installSteps} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apply</CardTitle>
        </CardHeader>
        <CardContent>
          <Steps steps={useSteps} />
        </CardContent>
      </Card>
    </div>
  );
}
