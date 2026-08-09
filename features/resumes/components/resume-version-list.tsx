import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { setDefaultResumeVersionAction } from "@/features/resumes/actions/resume-version-actions";
import type { ResumeVersion } from "@/lib/db/schema";

export function ResumeVersionList({
  versions,
}: {
  versions: ResumeVersion[];
}) {
  if (versions.length === 0) {
    return (
      <EmptyState
        title="No versions yet"
        description="Upload a PDF to this resume group before creating an application."
      />
    );
  }

  const latest = versions.reduce((newest, version) =>
    version.versionNumber > newest.versionNumber ? version : newest,
  );
  const hasExplicitDefault = versions.some((version) => version.isDefault);

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
      {versions.map((version) => {
        const isEffectiveDefault = hasExplicitDefault
          ? version.isDefault
          : version.id === latest.id;

        return (
          <li
            key={version.publicId}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-meta font-medium text-text-primary">
                  {version.label}
                </p>
                {isEffectiveDefault ? (
                  <Badge tone="green">
                    {version.isDefault ? "Default" : "Latest"}
                  </Badge>
                ) : null}
              </div>
              <p className="font-mono text-system text-text-muted">
                v{version.versionNumber} ·{" "}
                {version.createdAt.toLocaleDateString()}
              </p>
            </div>

            {version.isDefault ? null : (
              <form action={setDefaultResumeVersionAction}>
                <input
                  type="hidden"
                  name="versionPublicId"
                  value={version.publicId}
                />
                <Button type="submit" variant="outline" size="compact">
                  Make default
                </Button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
