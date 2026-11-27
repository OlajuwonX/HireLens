import { applicationRefSchema } from "@/features/extension/schemas";
import { loadExtensionCoverLetter } from "@/features/extension/server/fill.service";
import { json, workerRoute } from "@/features/worker/server/worker-route";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

export const GET = workerRoute(async (worker, _body, request) => {
  const parsed = applicationRefSchema.safeParse({
    applicationPublicId: new URL(request.url).searchParams.get("application") ?? undefined,
  });
  const bytes = parsed.success ? await loadExtensionCoverLetter(worker, parsed.data.applicationPublicId) : null;

  if (!bytes) {
    return json({ error: "NOT_FOUND" }, 404);
  }

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="cover-letter.pdf"',
      "Cache-Control": "no-store",
    },
  });
});
