import { taskRefSchema } from "@/features/worker/contract";
import { heartbeat } from "@/features/worker/server/worker.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const POST = workerRoute(async (worker, body) => {
  const parsed = taskRefSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: "INVALID_REQUEST" }, 400);
  }

  const extended = await heartbeat(worker, parsed.data.taskId);

  return extended ? json({ ok: true }) : json({ error: "LEASE_LOST" }, 409);
});
