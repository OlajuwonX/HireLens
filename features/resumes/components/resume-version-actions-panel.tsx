import { Button } from "@/components/ui/button";
import { setDefaultResumeVersionAction } from "@/features/resumes/actions/resume-version-actions";
import type { ResumeVersion } from "@/lib/db/schema";

export function ResumeVersionActionsPanel({
  version,
}: {
  version: ResumeVersion;
}) {
  return (
    <form action={setDefaultResumeVersionAction}>
      <input type="hidden" name="versionPublicId" value={version.publicId} />
      <Button type="submit" variant="secondary" disabled={version.isDefault}>
        {version.isDefault ? "Current default" : "Mark as default"}
      </Button>
    </form>
  );
}
