import { Button } from "@/components/ui/button";
import { runGeneralResumeAnalysisAction } from "@/features/analyses/actions/analysis-actions";

export function RunAnalysisForm({
  resumePublicId,
  versionPublicId,
}: {
  resumePublicId: string;
  versionPublicId: string;
}) {
  return (
    <form action={runGeneralResumeAnalysisAction}>
      <input type="hidden" name="resumePublicId" value={resumePublicId} />
      <input type="hidden" name="versionPublicId" value={versionPublicId} />
      <Button type="submit">Run general analysis</Button>
    </form>
  );
}
