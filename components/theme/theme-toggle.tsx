"use client";

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
        "inline-flex items-center gap-1",
        block && "flex",
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = mounted && preference === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => select(value)}
            className={cn(
              "grid size-8 place-items-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary",
              active && "bg-surface-elevated text-text-primary",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
