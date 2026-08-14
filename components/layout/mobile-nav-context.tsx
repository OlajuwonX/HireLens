"use client";

import { createContext, useContext } from "react";

const MobileNavContext = createContext<(() => void) | null>(null);

export const MobileNavProvider = MobileNavContext.Provider;

export function useCloseMobileNav() {
  const close = useContext(MobileNavContext);

  return close ?? (() => undefined);
}
