import type { ReactNode } from "react";
import { PageHeader } from "./page-header";

export function PageLoading({
  title,
  description,
  label,
  children,
}: {
  title: string;
  description?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader title={title} description={description} />
      <div aria-hidden className="space-y-4">
        {children}
      </div>
      <span className="sr-only">Loading {label}</span>
    </div>
  );
}
