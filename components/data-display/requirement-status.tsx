import { StatusBadge } from "./status-badge";

export function RequirementStatus({ status }: { status: "STRONG" | "PARTIAL" | "MISSING" | "UNCLEAR" }) {
  const mapped = {
    STRONG: "ready",
    PARTIAL: "pending",
    MISSING: "failed",
    UNCLEAR: "archived",
  } as const;

  return <StatusBadge status={mapped[status]} />;
}
