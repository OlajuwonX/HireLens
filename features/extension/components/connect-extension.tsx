"use client";

import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { connectExtensionAction } from "../actions/connect-actions";
import { EXTENSION_MESSAGE_SOURCE } from "../constants";

type Status = "idle" | "waiting" | "connected" | "missing" | "error";

const ACK_TIMEOUT_MS = 4_000;
const EXTENSION_SOURCE = `${EXTENSION_MESSAGE_SOURCE}-extension`;

const messages: Record<Exclude<Status, "idle" | "waiting">, { tone: "success" | "warning" | "error"; text: string }> = {
  connected: { tone: "success", text: "Connected. You can close this tab and use Fill with HireLens on any application page." },
  missing: {
    tone: "warning",
    text: "The extension did not answer. Install it with the steps below, reload this page, then select Connect again.",
  },
  error: { tone: "error", text: "HireLens could not create a connection. Please try again." },
};

export function ConnectExtension() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");
  const [detected, setDetected] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.data?.source !== EXTENSION_SOURCE) return;
      if (event.data.type === "ready") setDetected(true);
      if (event.data.type === "connected") setStatus("connected");
      if (event.data.type === "connect-failed") {
        setFailure(typeof event.data.message === "string" ? event.data.message : null);
        setStatus("error");
      }
    };

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (status !== "waiting") return;

    const timer = window.setTimeout(() => setStatus((current) => (current === "waiting" ? "missing" : current)), ACK_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [status]);

  const connect = useMutation({
    mutationFn: () => connectExtensionAction(),
    onSuccess: (result) => {
      if (!result.ok) {
        setStatus("error");
        return;
      }

      setFailure(null);
      setStatus("waiting");
      window.postMessage(
        { source: EXTENSION_MESSAGE_SOURCE, type: "extension-token", token: result.token, bypass: result.bypass, origin: window.location.origin },
        window.location.origin,
      );
    },
    onError: () => setStatus("error"),
  });

  const { mutate } = connect;

  useEffect(() => {
    if (params.get("connect") === "1" && !autoStarted.current) {
      autoStarted.current = true;
      mutate();
    }
  }, [params, mutate]);

  const busy = connect.isPending || status === "waiting";
  const message = status === "idle" || status === "waiting" ? null : messages[status];

  return (
    <div className="space-y-3">
      <p className="text-meta text-text-secondary">
        {detected ? "The HireLens extension is installed in this browser." : "Install the extension first, then connect it to your account."}
      </p>
      <Button type="button" disabled={busy} onClick={() => mutate()}>
        {busy ? "Connecting..." : status === "connected" ? "Connect again" : "Connect extension"}
      </Button>
      {message ? <Alert tone={message.tone}>{status === "error" && failure ? failure : message.text}</Alert> : null}
    </div>
  );
}
