import { emailBatchSchema } from "@/features/responses/schemas/email.schema";
import { ingestEmails } from "@/features/responses/server/ingest.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = workerRoute(async (worker, body) => {
  const parsed = emailBatchSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: "INVALID_REQUEST" }, 400);
  }

  return json(await ingestEmails({ userId: worker.userId, emails: parsed.data.emails }));
});
