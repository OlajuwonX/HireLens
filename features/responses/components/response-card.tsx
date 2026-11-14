import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResponseKind } from "@/lib/responses/classify";
import { kindLabels, kindTones, RESPONSES_PATH } from "../constants";
import type { ResponseRow } from "../server/email.repository";
import { GeneratePrepButton } from "./generate-prep-button";
import { ReviewForm } from "./review-form";

export function ResponseCard({
  row,
  applications,
}: {
  row: ResponseRow;
  applications: { publicId: string; label: string }[];
}) {
  const kind = row.kind as ResponseKind;

  return (
    <li className="space-y-2 rounded-card border border-border bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={kindTones[kind]}>{kindLabels[kind]}</Badge>
        {row.company ? (
          <span className="text-meta font-medium text-text-primary">
            {row.company} · {row.title}
          </span>
        ) : (
          <span className="text-meta text-text-muted">Not linked to an application</span>
        )}
        <span className="ml-auto font-mono text-system text-text-muted">{row.receivedAt.toLocaleDateString()}</span>
      </div>

      <p className="text-meta font-medium text-text-primary">{row.subject}</p>
      <p className="line-clamp-2 text-label text-text-secondary">{row.snippet}</p>
      <p className="font-mono text-system text-text-muted">From {row.fromAddress}</p>

      {row.status === "NEEDS_REVIEW" ? (
        <ReviewForm publicId={row.publicId} kind={kind} applications={applications} />
      ) : null}

      {row.prepPublicId && row.status !== "NEEDS_REVIEW" ? (
        <div className="flex flex-wrap gap-2">
          {row.prepStatus === "READY" ? (
            <Button asChild size="compact">
              <Link href={`${RESPONSES_PATH}/prep/${row.prepPublicId}`}>Open interview preparation</Link>
            </Button>
          ) : (
            <GeneratePrepButton publicId={row.prepPublicId} />
          )}
        </div>
      ) : null}
    </li>
  );
}
