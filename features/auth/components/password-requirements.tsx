"use client";

import { PASSWORD_RULES } from "@/features/auth/schemas/password-rules";
import { cn } from "@/lib/utils";
import { Check, Circle, X } from "lucide-react";

type PasswordRequirementsProps = {
  id: string;
  value: string;
  highlightUnmet: boolean;
};

export function PasswordRequirements({
  id,
  value,
  highlightUnmet,
}: PasswordRequirementsProps) {
  return (
    <ul id={id} role="list" className="grid gap-1.5 pt-0.5 sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.isMet(value);
        const Icon = met ? Check : highlightUnmet ? X : Circle;

        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-label transition-colors",
              met && "text-text-secondary",
              !met && highlightUnmet && "text-danger",
              !met && !highlightUnmet && "text-text-muted",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span>{rule.label}</span>
            <span className="sr-only">
              {met ? "requirement met" : "still needed"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
