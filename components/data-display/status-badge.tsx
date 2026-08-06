import { Badge } from "@/components/ui/badge";

const toneByStatus = {
  ready: "green",
  active: "green",
  pending: "yellow",
  failed: "red",
  archived: "neutral",
} as const;

export function StatusBadge({ status }: { status: keyof typeof toneByStatus | string }) {
  const key = status.toLowerCase() as keyof typeof toneByStatus;
  return <Badge tone={toneByStatus[key] ?? "neutral"}>{status}</Badge>;
}
