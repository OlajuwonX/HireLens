"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useTransition, type ReactNode } from "react";
import { notify } from "@/components/ui/toast";
import { refreshDiscoveryAction } from "../actions/discovery-actions";

type DiscoveryRefresh = {
  checking: boolean;
  loading: boolean;
  refresh: () => void;
  replace: (href: string) => void;
};

const RefreshContext = createContext<DiscoveryRefresh>({
  checking: false,
  loading: false,
  refresh: () => undefined,
  replace: () => undefined,
});

export function DiscoveryRefreshProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [reloading, startReload] = useTransition();
  const [filtering, startFilter] = useTransition();

  const check = useMutation({
    mutationFn: () => refreshDiscoveryAction(),
    onSuccess: (report) => {
      notify.success(
        report.synced > 0
          ? `Checked ${report.synced} sources for new jobs.`
          : "Everything was checked recently. You're up to date.",
      );
      startReload(() => router.refresh());
    },
    onError: () => notify.error("The check could not finish. Showing your previous jobs."),
  });

  const { mutate, isPending } = check;
  const value = useMemo(
    () => ({
      checking: isPending || reloading,
      loading: isPending || reloading || filtering,
      refresh: () => mutate(),
      replace: (href: string) => startFilter(() => router.replace(href)),
    }),
    [isPending, reloading, filtering, mutate, router],
  );

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export function useDiscoveryRefresh() {
  return useContext(RefreshContext);
}
