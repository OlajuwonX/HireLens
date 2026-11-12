import "server-only";

import * as Sentry from "@sentry/nextjs";
import { authenticateWorker, type WorkerIdentity } from "./worker-auth";

type Handler = (worker: WorkerIdentity, body: unknown, request: Request) => Promise<Response>;

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readBody(request: Request) {
  if (request.method === "GET") {
    return null;
  }

  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function workerRoute(handler: Handler) {
  return async (request: Request) => {
    const worker = await authenticateWorker(request);

    if (!worker) {
      return json({ error: "UNAUTHORIZED" }, 401);
    }

    const body = await readBody(request);

    if (body === undefined) {
      return json({ error: "INVALID_JSON" }, 400);
    }

    try {
      return await handler(worker, body, request);
    } catch (error) {
      Sentry.captureException(error, { tags: { source: "local-worker-api" } });

      return json({ error: "SERVER_ERROR" }, 500);
    }
  };
}
