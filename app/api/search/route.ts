import * as Sentry from "@sentry/nextjs";
import { resolveSearchIdentity } from "@/features/search/server/search-identity";
import { runSearch } from "@/features/search/server/search.service";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const identity = await resolveSearchIdentity();

  if (identity.status === "unauthenticated") {
    return Response.json(
      { error: "Sign in to search." },
      { status: 401, headers: NO_STORE },
    );
  }

  if (identity.status === "blocked") {
    return Response.json(
      { error: "This account cannot search right now." },
      { status: 403, headers: NO_STORE },
    );
  }

  const query = new URL(request.url).searchParams.get("q");

  try {
    const results = await runSearch(identity.userId, query);

    return Response.json(results, { headers: NO_STORE });
  } catch (error) {
    Sentry.captureException(error, { tags: { source: "global-search" } });

    return Response.json(
      { error: "Search is unavailable right now." },
      { status: 500, headers: NO_STORE },
    );
  }
}
