import { claimNextTask } from "@/features/worker/server/worker.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const POST = workerRoute(async (worker) => json(await claimNextTask(worker)));
