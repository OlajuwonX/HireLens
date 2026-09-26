"use client";

import { notify } from "@/components/ui/toast";
import { useEffect, useRef } from "react";

export function JobSavedToast() {
  const announced = useRef(false);

  useEffect(() => {
    if (announced.current) {
      return;
    }

    announced.current = true;
    notify.success("Job saved.");
  }, []);

  return null;
}
