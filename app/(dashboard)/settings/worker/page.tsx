import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { WorkerTokenForm } from "@/features/worker/components/worker-token-form";
import { WorkerTokenList } from "@/features/worker/components/worker-token-list";
import { listWorkerTokens } from "@/features/worker/server/token.repository";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local worker",
};

const steps = [
  "Install Node.js 20 or newer and Google Chrome or Microsoft Edge.",
  "In the HireLens folder, run: cd local-worker && pnpm install --ignore-workspace",
  "Copy .env.example to .env and paste your token and HireLens address.",
  "Run: pnpm start. A browser opens for each approved application and fills it in.",
  "Check every filled form and press submit yourself. The worker records the confirmation.",
];

export default async function WorkerSettingsPage() {
  const user = await requireDatabaseUser();
  const tokens = await listWorkerTokens(user.id);

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/auto-apply" label="Auto Apply" />

      <PageHeader
        title="Local worker"
        description="A small program on your own computer fills in approved applications in your browser. It is free and nothing runs on a server."
      />

      <Card>
        <CardHeader>
          <CardTitle>Worker tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <WorkerTokenForm />
          <WorkerTokenList tokens={tokens} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Set up</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-meta text-text-secondary">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
