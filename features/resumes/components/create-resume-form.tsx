import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createResumeMetadataAction } from "@/features/resumes/actions/resume-actions";

export function CreateResumeForm() {
  return (
    <form action={createResumeMetadataAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          Resume name
        </label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          placeholder="General resume, Product Manager resume..."
        />
      </div>
      <Button type="submit">Create resume record</Button>
    </form>
  );
}
