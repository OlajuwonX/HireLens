"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { checkGmailNowAction, disconnectGmailAction, type GmailActionResult } from "../actions/gmail-actions";
import { GMAIL_CONNECT_PATH } from "../gmail";

export type GmailPanelState = "unavailable" | "disconnected" | "connected" | "reconnect";

function useGmailAction(action: () => Promise<GmailActionResult>) {
  const router = useRouter();

  return useMutation({
    mutationFn: action,
    onSuccess: (result) => {
      if (result.ok) notify.success(result.message);
      else notify.error(result.message);
      router.refresh();
    },
    onError: () => notify.error("Gmail could not be reached. Please try again."),
  });
}

function ConnectLink({ label }: { label: string }) {
  return (
    <Button asChild size="compact">
      <a href={GMAIL_CONNECT_PATH}>{label}</a>
    </Button>
  );
}

export function GmailPanel({ state, checkedLabel }: { state: GmailPanelState; checkedLabel: string | null }) {
  const check = useGmailAction(checkGmailNowAction);
  const disconnect = useGmailAction(disconnectGmailAction);

  if (state === "unavailable") {
    return (
      <Alert tone="info">
        Gmail checking is not set up on this server yet. Follow the Gmail steps in the user guide, or connect Gmail in
        your local worker.
      </Alert>
    );
  }

  if (state === "disconnected" || state === "reconnect") {
    return (
      <Alert tone={state === "reconnect" ? "warning" : "info"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="min-w-0 flex-1">
            {state === "reconnect"
              ? "Google stopped HireLens from reading your Gmail. Connect it again to keep seeing replies."
              : "Connect Gmail and HireLens checks it for replies from companies you applied to. It only reads; it never sends or deletes."}
          </span>
          <ConnectLink label={state === "reconnect" ? "Reconnect Gmail" : "Connect Gmail"} />
        </div>
      </Alert>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface p-4">
      <p className="min-w-0 flex-1 text-meta text-text-secondary">
        Gmail is connected and checked every day.{checkedLabel ? ` Last checked ${checkedLabel}.` : ""}
      </p>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="compact" disabled={check.isPending} onClick={() => check.mutate()}>
          {check.isPending ? "Checking..." : "Check now"}
        </Button>
        <Button type="button" size="compact" variant="ghost" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>
          Disconnect
        </Button>
      </div>
    </div>
  );
}
