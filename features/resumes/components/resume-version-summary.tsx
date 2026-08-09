import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ResumeVersion } from "@/lib/db/schema";

export function ResumeVersionSummary({ version }: { version: ResumeVersion }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-section-title font-semibold text-text-primary">Version details</h2>
      </CardHeader>
      <CardContent className="space-y-2 text-meta text-text-secondary">
        <p>Label: {version.label}</p>
        <p>Version number: {version.versionNumber}</p>
        <p>Default: {version.isDefault ? "Yes" : "No"}</p>
        <p>Created: {version.createdAt.toLocaleString()}</p>
        <p>Updated: {version.updatedAt.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
