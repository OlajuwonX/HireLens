"use client";

import { useEffect, useRef } from "react";
import { notify } from "@/components/ui/toast";

type ActionState = { status: string; message: string };

export function useActionToast<State extends ActionState>(
  state: State,
  onSuccess?: () => void,
) {
  const announced = useRef(state);
  const latest = useRef(onSuccess);

  useEffect(() => {
    latest.current = onSuccess;
  });

  useEffect(() => {
    if (state === announced.current || state.status === "idle") {
      return;
    }

    announced.current = state;

    if (state.status === "error") {
      notify.error(state.message);
      return;
    }

    notify.success(state.message);
    latest.current?.();
  }, [state]);
}
