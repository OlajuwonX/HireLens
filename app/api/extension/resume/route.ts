import { resumeQuerySchema } from "@/features/extension/schemas";
import { loadExtensionResume } from "@/features/extension/server/fill.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

export const GET = workerRoute(async (worker, _body, request) => {
  const parsed = resumeQuerySchema.safeParse({
    application: new URL(request.url).searchParams.get("application") ?? undefined,
  });
  const resume = parsed.success ? await loadExtensionResume(worker, parsed.data.application) : null;

  if (!resume) {
    return json({ error: "NOT_FOUND" }, 404);
  }

  return new Response(Buffer.from(resume.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="resume.pdf"',
      "Cache-Control": "no-store",
    },
  });
});
