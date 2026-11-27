import { importPageSchema } from "@/features/extension/schemas";
import { importPageJob } from "@/features/extension/server/import.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const maxDuration = 30;

export const POST = workerRoute(async (worker, body) => {
  const parsed = importPageSchema.safeParse(body);

  return parsed.success ? json(await importPageJob(worker, parsed.data)) : json({ error: "INVALID_REQUEST" }, 400);
});
