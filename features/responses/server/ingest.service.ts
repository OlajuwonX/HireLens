import "server-only";

import { recordApplicationActivity } from "@/features/applications/server/application.repository";
import { notifyUser } from "@/features/notifications/server/notification.service";
import { classifyEmail, POSITIVE_KINDS, type ResponseKind } from "@/lib/responses/classify";
import { matchApplication } from "@/lib/responses/match";
import type { InboundEmail } from "../schemas/email.schema";
import { kindLabels } from "../constants";
import { existingMessageIds, insertEmailEvent, listApplicationCandidates } from "./email.repository";
import { ensurePendingPrep } from "./prep.repository";
import { generatePrep } from "./prep.service";

const SNIPPET_LENGTH = 300;

export type IngestReport = { received: number; stored: number; duplicates: number; priority: number; prepared: number };

function snippet(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, SNIPPET_LENGTH);
}

async function announce(input: { userId: string; applicationId: string; kind: ResponseKind; company: string }) {
  const label = kindLabels[input.kind];

  await recordApplicationActivity({ userId: input.userId, applicationId: input.applicationId, title: `${label} received` });

  if (POSITIVE_KINDS.includes(input.kind) || input.kind === "REJECTION") {
    await notifyUser({
      userId: input.userId,
      kind: "APPLICATION_UPDATE",
      title: POSITIVE_KINDS.includes(input.kind) ? `${label} from ${input.company}` : `Update from ${input.company}`,
      body: POSITIVE_KINDS.includes(input.kind) ? "Open Responses to prepare. HireLens has not replied for you." : null,
      applicationId: input.applicationId,
    });
  }
}

export async function ingestEmails(input: { userId: string; emails: InboundEmail[] }): Promise<IngestReport> {
  const seen = await existingMessageIds({ userId: input.userId, messageIds: input.emails.map((email) => email.messageId) });
  const fresh = input.emails.filter((email) => !seen.has(email.messageId));
  const candidates = fresh.length > 0 ? await listApplicationCandidates(input.userId) : [];
  const report: IngestReport = { received: input.emails.length, stored: 0, duplicates: seen.size, priority: 0, prepared: 0 };

  for (const email of fresh) {
    const { kind, confidence, needsReview } = classifyEmail(email);
    const match = matchApplication(email, candidates);
    const event = await insertEmailEvent({
      userId: input.userId,
      messageId: email.messageId,
      threadId: email.threadId ?? null,
      fromAddress: email.from,
      subject: email.subject,
      snippet: snippet(email.text),
      receivedAt: new Date(email.receivedAt),
      kind,
      confidence,
      status: needsReview || !match ? "NEEDS_REVIEW" : "AUTO",
      applicationId: match?.applicationId ?? null,
      matchScore: match?.score ?? null,
    });

    if (!event) {
      report.duplicates += 1;
      continue;
    }

    report.stored += 1;

    if (!match || needsReview) {
      continue;
    }

    const company = candidates.find((candidate) => candidate.id === match.applicationId)?.company ?? "an employer";
    await announce({ userId: input.userId, applicationId: match.applicationId, kind, company });

    if (POSITIVE_KINDS.includes(kind)) {
      report.priority += 1;
    }

    if (kind === "INTERVIEW" && report.prepared === 0) {
      const prep = await ensurePendingPrep({ userId: input.userId, applicationId: match.applicationId, emailEventId: event.id });
      const outcome = await generatePrep({ userId: input.userId, prep, emailText: email.text });

      report.prepared += outcome.ok ? 1 : 0;
    }
  }

  return report;
}
