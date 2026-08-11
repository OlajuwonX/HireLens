import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const FONT_SIZES = [
  "display",
  "page-title",
  "section-title",
  "card-metric",
  "body",
  "meta",
  "label",
  "system",
];

const TEXT_COLORS = [
  "text-primary",
  "text-secondary",
  "text-muted",
  "accent-text",
  "action-dark-text",
  "danger-text",
  "warning-text",
  "info-text",
  "accent",
  "accent-hover",
  "danger",
  "warning",
  "info",
  "surface",
  "surface-secondary",
  "surface-elevated",
  "background",
  "border",
  "border-strong",
  "sidebar",
  "action-dark",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
      "text-color": [{ text: TEXT_COLORS }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
