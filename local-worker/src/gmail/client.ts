import type { GmailMessage } from "./parse";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
export const INBOX_QUERY = "newer_than:3d -category:promotions -category:social -in:chats";

export type GmailApi = {
  listIds: () => Promise<string[]>;
  get: (id: string) => Promise<GmailMessage>;
};

export function createGmailApi(accessToken: () => Promise<string>, fetchImpl: typeof fetch = fetch): GmailApi {
  const call = async (url: string) => {
    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${await accessToken()}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Gmail responded with ${response.status}`);
    }

    return response.json();
  };

  return {
    listIds: async () => {
      const body = (await call(`${BASE}?maxResults=50&q=${encodeURIComponent(INBOX_QUERY)}`)) as {
        messages?: { id: string }[];
      };

      return (body.messages ?? []).map((message) => message.id);
    },
    get: async (id) => (await call(`${BASE}/${encodeURIComponent(id)}?format=full`)) as GmailMessage,
  };
}
