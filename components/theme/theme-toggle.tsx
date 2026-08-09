"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "./theme-script";

type ThemePreference = "light" | "dark" | "system";

const options: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

function applyTheme(preference: ThemePreference) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark =
    preference === "dark" || (preference === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeToggle({
  className,
  block = false,
}: {
  className?: string;
  block?: boolean;
}) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(
      THEME_STORAGE_KEY,
    ) as ThemePreference | null;
    setPreference(stored ?? "system");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || preference !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mounted, preference]);

  function select(next: ThemePreference) {
    setPreference(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex rounded-control border border-border bg-surface",
        block && "flex w-full",
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = mounted && preference === value;

        return (
          <Button
            key={value}
            variant={active ? "segmentActive" : "segment"}
            size="compact"
            role="radio"
            aria-checked={active}
            onClick={() => select(value)}
            className={cn("gap-1.5 px-2.5 font-medium", block && "flex-1")}
          >
            <Icon aria-hidden="true" className="size-3" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
