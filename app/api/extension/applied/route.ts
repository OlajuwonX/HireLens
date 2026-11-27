import { applicationRefSchema } from "@/features/extension/schemas";
import { markAppliedFromExtension } from "@/features/extension/server/applied.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const POST = workerRoute(async (worker, body) => {
  const parsed = applicationRefSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: "INVALID_APPLICATION" }, 400);
  }

  return (await markAppliedFromExtension(worker, parsed.data.applicationPublicId))
    ? json({ ok: true })
    : json({ error: "NOT_FOUND" }, 404);
});
