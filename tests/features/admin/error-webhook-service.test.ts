import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  mapSentryIssuePayload,
  verifySentrySignature,
} from "@/features/admin/server/error-webhook.service";

const SECRET = "test-secret";

function sign(body: string) {
  return createHmac("sha256", SECRET).update(body, "utf8").digest("hex");
}

describe("verifySentrySignature", () => {
  it("accepts a correctly signed body", () => {
    const body = '{"hello":"world"}';

    expect(verifySentrySignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = '{"hello":"world"}';
    const signature = sign(body);

    expect(verifySentrySignature('{"hello":"tampered"}', signature, SECRET)).toBe(
      false,
    );
  });

  it("rejects a missing signature", () => {
    expect(verifySentrySignature('{"a":1}', null, SECRET)).toBe(false);
  });

  it("rejects a signature of a different length without throwing", () => {
    expect(verifySentrySignature('{"a":1}', "short", SECRET)).toBe(false);
  });

  it("rejects a well-formed but wrong signature", () => {
    const body = '{"a":1}';

    expect(
      verifySentrySignature(body, sign('{"a":2}'), SECRET),
    ).toBe(false);
  });
});

describe("mapSentryIssuePayload", () => {
  it("maps a well-formed issue webhook payload", () => {
    const payload = {
      data: {
        issue: {
          id: "issue-123",
          title: "TypeError: x is not a function",
          culprit: "app/page.tsx",
          level: "error",
          count: "42",
          firstSeen: "2026-09-01T00:00:00.000Z",
          lastSeen: "2026-09-18T00:00:00.000Z",
          permalink: "https://sentry.io/issues/issue-123/",
        },
        event: { event_id: "event-abc" },
      },
    };

    expect(mapSentryIssuePayload(payload)).toMatchObject({
      issueId: "issue-123",
      sentryEventId: "event-abc",
      title: "TypeError: x is not a function",
      level: "error",
      eventCount: 42,
      permalink: "https://sentry.io/issues/issue-123/",
    });
  });

  it("returns null for a payload missing the issue entirely", () => {
    expect(mapSentryIssuePayload({ data: {} })).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(mapSentryIssuePayload("not json")).toBeNull();
    expect(mapSentryIssuePayload(null)).toBeNull();
  });

  it("defaults eventCount to 1 when count is missing or unparseable", () => {
    const payload = {
      data: { issue: { id: "i1", title: "t" } },
    };

    expect(mapSentryIssuePayload(payload)?.eventCount).toBe(1);
  });

  it("works without the optional event block", () => {
    const payload = {
      data: { issue: { id: "i1", title: "t" } },
    };

    expect(mapSentryIssuePayload(payload)?.sentryEventId).toBeNull();
  });
});
