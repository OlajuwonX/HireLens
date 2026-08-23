import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import {
  deleteResumeVersionAction,
  setDefaultResumeVersionAction,
} from "@/features/resumes/actions/resume-version-actions";
import type { ResumeVersion } from "@/lib/db/schema";

export function ResumeVersionList({
  versions,
  resumePublicId,
}: {
  versions: ResumeVersion[];
  resumePublicId: string;
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
            <div className="min-w-0 flex-1 basis-full sm:basis-auto">
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

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="compact">
                <a
                  href={`/dashboard/resumes/${resumePublicId}/versions/${version.publicId}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="size-4" aria-hidden />
                  View
                </a>
              </Button>

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

              {versions.length > 1 ? (
                <DeleteConfirmButton
                  action={deleteResumeVersionAction}
                  publicId={version.publicId}
                  fieldName="versionPublicId"
                  title={`Delete "${version.label}"?`}
                  description="This removes the version and its stored PDF. Applications already analysed against it keep their results."
                  toastLabel={version.label}
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
