"use client";

import { useUiStore } from "@/lib/stores/ui-store";
import { useEffect } from "react";

export function PageTitle({ title }: { title: string }) {
  const setPageTitle = useUiStore((state) => state.setPageTitle);

  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [title, setPageTitle]);

  return null;
}
