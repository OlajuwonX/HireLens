import { fillRequestSchema } from "@/features/extension/schemas";
import { buildFillData } from "@/features/extension/server/fill.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const POST = workerRoute(async (worker, body) => {
  const parsed = fillRequestSchema.safeParse(body);

  return parsed.success ? json(await buildFillData(worker, parsed.data.url)) : json({ error: "INVALID_URL" }, 400);
});
