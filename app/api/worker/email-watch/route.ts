import { listApplicationCandidates } from "@/features/responses/server/email.repository";
import { json, workerRoute } from "@/features/worker/server/worker-route";
import { ATS_MAIL_DOMAINS, watchTerms } from "@/lib/responses/match";

export const dynamic = "force-dynamic";

export const GET = workerRoute(async (worker) =>
  json({
    terms: watchTerms(await listApplicationCandidates(worker.userId)),
    domains: ATS_MAIL_DOMAINS,
  }),
);
