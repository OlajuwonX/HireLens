import type { FetchJson } from "./types";

export const BOARD_TIMEOUT_MS = 15_000;

export class BoardFetchError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "BoardFetchError";
  }

  get notFound() {
    return this.status === 404;
  }
}

export const fetchJson: FetchJson = async (url) => {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "HireLens job discovery" },
      signal: AbortSignal.timeout(BOARD_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new BoardFetchError("The job board could not be reached", null);
  }

  if (!response.ok) {
    throw new BoardFetchError(`The job board responded with ${response.status}`, response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new BoardFetchError("The job board returned unreadable data", response.status);
  }
};
