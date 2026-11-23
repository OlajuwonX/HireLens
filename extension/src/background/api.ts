import type { AnswersBody, AnswersReply, BoostReply, Connection, FillData, ImportReply, PageJob } from "../shared/types";

const QUICK_MS = 60_000;
const AI_MS = 90_000;

function headers(connection: Connection): Record<string, string> {
  return {
    Authorization: `Bearer ${connection.token}`,
    "Content-Type": "application/json",
    ...(connection.bypass ? { "x-vercel-protection-bypass": connection.bypass } : {}),
  };
}

async function call(connection: Connection, path: string, init: RequestInit = {}, timeoutMs = QUICK_MS) {
  const response = await fetch(`${connection.origin}${path}`, {
    ...init,
    headers: headers(connection),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (response.status === 401) {
    throw new Error("HireLens did not accept this browser. Open the extension and connect again.");
  }

  if (!response.ok) {
    throw new Error(`HireLens answered with an error (${response.status}).`);
  }

  return response;
}

const post = (connection: Connection, path: string, body: unknown, timeoutMs = QUICK_MS) =>
  call(connection, path, { method: "POST", body: JSON.stringify(body) }, timeoutMs);

export async function checkConnection(connection: Connection) {
  await call(connection, "/api/worker/ping");
}

export async function fetchFillData(connection: Connection, url: string): Promise<FillData> {
  return (await post(connection, "/api/extension/fill", { url })).json();
}

export async function fetchPdf(connection: Connection, path: string) {
  const bytes = new Uint8Array(await (await call(connection, path)).arrayBuffer());

  return toBase64(bytes);
}

export async function reportApplied(connection: Connection, applicationPublicId: string) {
  await post(connection, "/api/extension/applied", { applicationPublicId });
}

export async function boostResume(connection: Connection, applicationPublicId: string): Promise<BoostReply> {
  return (await post(connection, "/api/extension/boost", { applicationPublicId }, AI_MS)).json();
}

export async function importJob(connection: Connection, page: PageJob): Promise<ImportReply> {
  return (await post(connection, "/api/extension/import", page)).json();
}

export async function writeAnswers(connection: Connection, body: AnswersBody): Promise<AnswersReply> {
  return (await post(connection, "/api/extension/answers", body, AI_MS)).json();
}

export function toBase64(bytes: Uint8Array) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }

  return btoa(binary);
}
