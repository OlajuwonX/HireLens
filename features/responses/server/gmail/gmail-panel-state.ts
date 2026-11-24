import "server-only";

import type { GmailPanelState } from "../../components/gmail-panel";
import { gmailClient } from "./gmail-config";
import { findGmailConnection } from "./gmail.repository";

const formatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export async function loadGmailPanel(userId: string): Promise<{ state: GmailPanelState; checkedLabel: string | null }> {
  if (!gmailClient()) {
    return { state: "unavailable", checkedLabel: null };
  }

  const connection = await findGmailConnection(userId);

  if (!connection) {
    return { state: "disconnected", checkedLabel: null };
  }

  return {
    state: connection.status === "NEEDS_RECONNECT" ? "reconnect" : "connected",
    checkedLabel: connection.lastCheckedAt ? `${formatter.format(connection.lastCheckedAt)} UTC` : null,
  };
}
