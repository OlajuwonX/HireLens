import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ResumeVersion } from "@/lib/db/schema";

export function ResumeVersionList({
  resumePublicId,
  versions,
}: {
  resumePublicId: string;
  versions: ResumeVersion[];
}) {
  if (versions.length === 0) {
    return (
      <EmptyState
        title="No versions yet"
        description="Create a version once a resume PDF file asset is available."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {versions.map((version) => (
        <Card key={version.publicId}>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
            <div>
              <Link
                href={`/dashboard/resumes/${resumePublicId}/versions/${version.publicId}`}
                className="font-semibold text-text-primary hover:text-text-primary"
              >
                {version.label}
              </Link>
              <p className="mt-1 text-meta text-text-secondary">
                Version {version.versionNumber} · Created {version.createdAt.toLocaleDateString()}
              </p>
            </div>
            {version.isDefault ? <Badge tone="green">Default</Badge> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
