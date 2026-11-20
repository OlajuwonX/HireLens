"use client";

import { useEffect, useRef } from "react";
import { notify } from "@/components/ui/toast";
import { clearUrlFlags } from "@/features/applications/url-flags";

export function UrlFlagToast({
  message,
  flags,
}: {
  message: string;
  flags: readonly string[];
}) {
  const announced = useRef(false);

  useEffect(() => {
    if (announced.current) {
      return;
    }

    announced.current = true;
    notify.success(message);
    clearUrlFlags(flags);
  }, [message, flags]);

  return null;
}
