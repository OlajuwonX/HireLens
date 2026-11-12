import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const GET = workerRoute(async () => json({ ok: true }));
