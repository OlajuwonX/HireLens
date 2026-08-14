"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  pageTitle: string | null;
  setPageTitle: (title: string | null) => void;

  lastErrorEventId: string | null;
  setLastErrorEventId: (eventId: string | null) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      pageTitle: null,
      setPageTitle: (pageTitle) => set({ pageTitle }),

      lastErrorEventId: null,
      setLastErrorEventId: (lastErrorEventId) => set({ lastErrorEventId }),
    }),
    {
      name: "hirelens-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
      skipHydration: true,
    },
  ),
);
