import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createResumeVersionAction } from "@/features/resumes/actions/resume-version-actions";

export function CreateResumeVersionForm({
  resumePublicId,
}: {
  resumePublicId: string;
}) {
  return (
    <form action={createResumeVersionAction} className="space-y-4">
      <input type="hidden" name="resumePublicId" value={resumePublicId} />
      <div className="space-y-2">
        <label htmlFor="label" className="text-sm font-medium text-gray-700">
          Version label
        </label>
        <Input id="label" name="label" required maxLength={120} placeholder="Job-specific version" />
      </div>
      <div className="space-y-2">
        <label htmlFor="fileAssetPublicId" className="text-sm font-medium text-gray-700">
          Resume PDF file asset ID
        </label>
        <Input
          id="fileAssetPublicId"
          name="fileAssetPublicId"
          required
          placeholder="Paste an existing resume PDF file asset UUID"
        />
        <p className="text-sm text-gray-500">
          Full upload UI connects here after the resume upload flow is wired.
        </p>
      </div>
      <Button type="submit">Create version</Button>
    </form>
  );
}
