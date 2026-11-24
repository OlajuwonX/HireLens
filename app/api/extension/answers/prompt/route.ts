import { answersRequestSchema } from "@/features/extension/schemas";
import { buildFormAnswersPrompt } from "@/features/extension/server/answers.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const POST = workerRoute(async (worker, body) => {
  const parsed = answersRequestSchema.safeParse(body);

  return parsed.success ? json(await buildFormAnswersPrompt(worker, parsed.data)) : json({ error: "INVALID_REQUEST" }, 400);
});
