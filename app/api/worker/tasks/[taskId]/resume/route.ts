import { taskRefSchema } from "@/features/worker/contract";
import { loadTaskResume } from "@/features/worker/server/worker.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await context.params;

  return workerRoute(async (worker) => {
    const parsed = taskRefSchema.safeParse({ taskId });
    const bytes = parsed.success ? await loadTaskResume(worker, parsed.data.taskId) : null;

    if (!bytes) {
      return json({ error: "NOT_FOUND" }, 404);
    }

    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
        "Cache-Control": "no-store",
      },
    });
  })(request);
}
