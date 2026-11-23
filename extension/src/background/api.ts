import type { Connection, FillData } from "../shared/types";

function headers(connection: Connection): Record<string, string> {
  return {
    Authorization: `Bearer ${connection.token}`,
    "Content-Type": "application/json",
    ...(connection.bypass ? { "x-vercel-protection-bypass": connection.bypass } : {}),
  };
}

async function call(connection: Connection, path: string, init: RequestInit = {}) {
  const response = await fetch(`${connection.origin}${path}`, {
    ...init,
    headers: headers(connection),
    signal: AbortSignal.timeout(60_000),
  });

  if (response.status === 401) {
    throw new Error("HireLens did not accept this browser. Open the extension and connect again.");
  }

  if (!response.ok) {
    throw new Error(`HireLens answered with an error (${response.status}).`);
  }

  return response;
}

export async function checkConnection(connection: Connection) {
  await call(connection, "/api/worker/ping");
}

export async function fetchFillData(connection: Connection, url: string): Promise<FillData> {
  return (await call(connection, "/api/extension/fill", { method: "POST", body: JSON.stringify({ url }) })).json();
}

export async function fetchResume(connection: Connection, path: string) {
  const bytes = new Uint8Array(await (await call(connection, path)).arrayBuffer());

  return toBase64(bytes);
}

export async function reportApplied(connection: Connection, applicationPublicId: string) {
  await call(connection, "/api/extension/applied", { method: "POST", body: JSON.stringify({ applicationPublicId }) });
}

export function toBase64(bytes: Uint8Array) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }

  return btoa(binary);
}
