"use client";

import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

const toneStyles: Record<ToastTone, { icon: typeof Check; className: string }> =
  {
    success: { icon: Check, className: "bg-accent text-accent-text" },
    error: { icon: AlertTriangle, className: "bg-danger text-danger-text" },
    info: { icon: Info, className: "bg-action-dark text-action-dark-text" },
  };

function show(tone: ToastTone, message: string) {
  const { icon: Icon, className } = toneStyles[tone];

  return hotToast.custom(
    (instance) => (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-border bg-surface p-3 shadow-lg",
          instance.visible
            ? "animate-in fade-in slide-in-from-top-2"
            : "animate-out fade-out",
        )}
      >
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full",
            className,
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-meta leading-snug text-text-primary">
          {message}
        </p>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => hotToast.dismiss(instance.id)}
          className="-m-1 shrink-0 rounded-control p-1 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    ),
    { duration: tone === "error" ? 6000 : 4000 },
  );
}

export const notify = {
  success: (message: string) => show("success", message),
  error: (message: string) => show("error", message),
  info: (message: string) => show("info", message),
  copied: (label: string) => show("success", `${label} copied successfully.`),
  deleted: (label: string) => show("success", `${label} deleted successfully.`),
  saved: (label: string) => show("success", `${label} saved successfully.`),
  dismiss: hotToast.dismiss,
};

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      gutter={10}
      containerClassName="!inset-3 sm:!inset-5"
      toastOptions={{ className: "!bg-transparent !p-0 !shadow-none" }}
    />
  );
}
