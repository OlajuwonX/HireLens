"use client";

import { useState } from "react";

export function useOnceTrue(value: boolean) {
  const [seen, setSeen] = useState(value);

  if (value && !seen) {
    setSeen(true);
  }

  return seen || value;
}
