import { workerResultSchema } from "@/features/worker/contract";
import { reportResult } from "@/features/worker/server/worker.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const POST = workerRoute(async (worker, body) => {
  const parsed = workerResultSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: "INVALID_REQUEST" }, 400);
  }

  const recorded = await reportResult(worker, parsed.data);

  return recorded ? json({ ok: true }) : json({ error: "LEASE_LOST" }, 409);
});
