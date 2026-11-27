import { boostRequestSchema } from "@/features/extension/schemas";
import { boostApplication } from "@/features/extension/server/boost.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

export const POST = workerRoute(async (worker, body) => {
  const parsed = boostRequestSchema.safeParse(body);

  return parsed.success ? json(await boostApplication(worker, parsed.data.applicationPublicId)) : json({ error: "INVALID_REQUEST" }, 400);
});
