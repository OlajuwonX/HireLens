import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { groupResponses } from "@/features/responses/group";
import { emailBatchSchema } from "@/features/responses/schemas/email.schema";

const read = (path: string) => readFileSync(path, "utf8");
const migration = read("drizzle/0035_response_intelligence.sql");
const actions = read("features/responses/actions/response-actions.ts");

describe("response endpoints", () => {
  it("authenticate the worker", () => {
    expect(read("app/api/worker/emails/route.ts")).toContain("workerRoute(");
    expect(read("app/api/worker/email-watch/route.ts")).toContain("workerRoute(");
  });

  it("accept at most 25 emails of bounded size", () => {
    const one = { messageId: "m", from: "a@b.co", subject: "s", receivedAt: "2026-11-12T10:00:00.000Z", text: "t" };

    expect(emailBatchSchema.safeParse({ emails: Array(25).fill(one) }).success).toBe(true);
    expect(emailBatchSchema.safeParse({ emails: Array(26).fill(one) }).success).toBe(false);
    expect(emailBatchSchema.safeParse({ emails: [{ ...one, text: "x".repeat(6_001) }] }).success).toBe(false);
  });
});

describe("privacy and safety", () => {
  it("never sends email on the candidate's behalf", () => {
    for (const file of ["features/responses/server/ingest.service.ts", "features/responses/server/event-review.service.ts", actions]) {
      const source = file.includes("\n") ? file : read(file);

      expect(source).not.toMatch(/gmail\.send|messages\/send|sendEmail\(/i);
    }
  });

  it("stores no email body column", () => {
    expect(migration).toContain('"snippet" text NOT NULL');
    expect(migration).not.toMatch(/"body"|"text" text/);
  });

  it("deduplicates messages per user", () => {
    expect(migration).toContain('UNIQUE INDEX "email_events_user_message_idx"');
  });

  it("is additive", () => {
    expect(migration).not.toMatch(/\bDROP\b|\bALTER COLUMN\b|\bRENAME\b/i);
  });

  it("authenticates every action", () => {
    expect(actions.match(/export async function/g)?.length).toBe(actions.match(/await requireDatabaseUser\(\)/g)?.length);
  });
});

describe("groupResponses", () => {
  it("puts confident positive replies first and uncertain ones in review", () => {
    const groups = groupResponses([
      { status: "AUTO", kind: "INTERVIEW" },
      { status: "NEEDS_REVIEW", kind: "INTERVIEW" },
      { status: "AUTO", kind: "REJECTION" },
      { status: "CONFIRMED", kind: "OFFER" },
    ]);

    expect(groups.priority).toHaveLength(2);
    expect(groups.review).toHaveLength(1);
    expect(groups.other).toHaveLength(1);
  });
});
