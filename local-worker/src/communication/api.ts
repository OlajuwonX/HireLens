import { claimResponseSchema, type TaskPayload, type WorkerResult } from "../contract";
import type { WatchList } from "../gmail/filter";
import type { ParsedEmail } from "../gmail/parse";

export type HireLensApi = {
  ping: () => Promise<boolean>;
  claim: () => Promise<{ task: TaskPayload | null; reason?: string }>;
  heartbeat: (taskId: string) => Promise<boolean>;
  report: (result: WorkerResult) => Promise<boolean>;
  downloadResume: (path: string) => Promise<Uint8Array>;
  emailWatch: () => Promise<WatchList>;
  sendEmails: (emails: ParsedEmail[]) => Promise<void>;
};

export function createApi(input: {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
}): HireLensApi {
  const send = (path: string, init: RequestInit = {}) =>
    (input.fetchImpl ?? fetch)(`${input.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      signal: AbortSignal.timeout(30_000),
    });

  const post = (path: string, body: unknown) => send(path, { method: "POST", body: JSON.stringify(body) });

  return {
    ping: async () => (await send("/api/worker/ping")).ok,
    claim: async () => {
      const response = await post("/api/worker/claim", {});

      if (!response.ok) {
        throw new Error(`HireLens refused the claim (${response.status})`);
      }

      return claimResponseSchema.parse(await response.json());
    },
    heartbeat: async (taskId) => (await post("/api/worker/heartbeat", { taskId })).ok,
    report: async (result) => (await post("/api/worker/result", result)).ok,
    downloadResume: async (path) => {
      const response = await send(path);

      if (!response.ok) {
        throw new Error(`The resume could not be downloaded (${response.status})`);
      }

      return new Uint8Array(await response.arrayBuffer());
    },
    emailWatch: async () => {
      const response = await send("/api/worker/email-watch");

      if (!response.ok) {
        throw new Error(`HireLens refused the watch list (${response.status})`);
      }

      return (await response.json()) as WatchList;
    },
    sendEmails: async (emails) => {
      const response = await post("/api/worker/emails", { emails });

      if (!response.ok) {
        throw new Error(`HireLens refused the emails (${response.status})`);
      }
    },
  };
}
