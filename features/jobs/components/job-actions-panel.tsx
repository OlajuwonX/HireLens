import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  archiveJobAction,
  deleteJobAction,
  duplicateJobAction,
  restoreJobAction,
} from "@/features/jobs/actions/job-actions";
import type { Job } from "@/lib/db/schema";

export function JobActionsPanel({ job }: { job: Job }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={`/dashboard/jobs/${job.publicId}/edit`}>Edit</Link>
        </Button>

        <form action={duplicateJobAction}>
          <input type="hidden" name="publicId" value={job.publicId} />
          <Button type="submit" variant="outline">
            Duplicate
          </Button>
        </form>

        {job.status === "ARCHIVED" ? (
          <form action={restoreJobAction}>
            <input type="hidden" name="publicId" value={job.publicId} />
            <Button type="submit" variant="outline">
              Restore
            </Button>
          </form>
        ) : (
          <form action={archiveJobAction}>
            <input type="hidden" name="publicId" value={job.publicId} />
            <Button type="submit" variant="outline">
              Archive
            </Button>
          </form>
        )}

        <form action={deleteJobAction}>
          <input type="hidden" name="publicId" value={job.publicId} />
          <Button type="submit" variant="danger">
            Delete
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
