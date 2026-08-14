import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createResumeMetadataAction } from "@/features/resumes/actions/resume-actions";

export function CreateResumeForm() {
  return (
    <form action={createResumeMetadataAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Resume name</Label>
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
