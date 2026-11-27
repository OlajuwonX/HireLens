import type { ReactNode } from "react";

export function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="w-full rounded-card border border-border bg-surface p-5 shadow-2xl shadow-black/20 sm:p-6">
      <p data-reveal className="font-mono text-system font-medium uppercase text-text-muted">
        {label}
      </p>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" }) {
  return (
    <span
      className={
        tone === "accent"
          ? "shrink-0 font-mono text-system font-medium uppercase text-accent"
          : "shrink-0 font-mono text-system uppercase text-text-muted"
      }
    >
      {children}
    </span>
  );
}

export function Line({ title, detail, tag }: { title: string; detail?: string; tag?: ReactNode }) {
  return (
    <div data-reveal className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-meta font-medium text-text-primary">{title}</p>
        {detail ? <p className="text-label text-text-secondary">{detail}</p> : null}
      </div>
      {tag}
    </div>
  );
}
