"use client";

import { notify } from "@/components/ui/toast";
import {
  usageLimitMessage,
  type UsageDenialReason,
} from "@/features/usage/limit-notice";
import { useEffect, useRef } from "react";

export function AnalysisNoticeToast({
  limitReason,
}: {
  limitReason: UsageDenialReason | null;
}) {
  const announced = useRef<string | null>(null);
  const key = limitReason ?? "FAILED";

  useEffect(() => {
    if (announced.current === key) {
      return;
    }

    announced.current = key;

    notify.error(
      limitReason
        ? usageLimitMessage(limitReason)
        : "The job was saved, but the analysis could not be completed. Use Analyze to try again.",
    );
  }, [key, limitReason]);

  return null;
}
