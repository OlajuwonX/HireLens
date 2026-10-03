"use client";

import { notify } from "@/components/ui/toast";
import { clearUrlFlags } from "@/features/applications/url-flags";
import { useEffect, useRef } from "react";

export function JobSavedToast() {
  const announced = useRef(false);

  useEffect(() => {
    if (announced.current) {
      return;
    }

    announced.current = true;
    notify.success("Job saved.");
    clearUrlFlags(["saved"]);
  }, []);

  return null;
}
