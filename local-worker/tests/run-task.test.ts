import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import type { HireLensApi } from "../src/communication/api";
import type { FormField } from "../src/execution/fields";
import { processTask } from "../src/execution/process-task";
import { runTask } from "../src/execution/run-task";
import type { FormSession } from "../src/execution/session";
import { field, payload } from "./helpers";

function fakeSession(fields: FormField[], overrides: Partial<FormSession> = {}) {
  const values = new Map<string, string>();
  let attempted = false;
  const session: FormSession = {
    hasCaptcha: async () => false,
    fields: async () => fields,
    fill: async (fill) => {
      values.set(fill.field.selector, fill.value === "__RESUME_FILE__" ? "attached" : fill.value);
      return true;
    },
    read: async (fill) => values.get(fill.field.selector) ?? "",
    submit: vi.fn(async () => {
      attempted = true;
    }),
    waitForOutcome: async () => ({ confirmation: null, submitAttempted: attempted }),
    submitAttempted: () => attempted,
    close: async () => undefined,
    ...overrides,
  };

  return session;
}

const complete = [field("First Name", { required: true }), field("Email", { required: true }), field("Resume", { kind: "file", required: true })];
const options = { autoSubmit: false, confirmTimeoutMs: 10 };

describe("runTask", () => {
  it("fills and verifies but leaves submitting to the candidate by default", async () => {
    const session = fakeSession(complete);
    const result = await runTask(payload(), session, options);

    expect(session.submit).not.toHaveBeenCalled();
    expect(result.outcome).toBe("NEEDS_MANUAL_ACTION");
    expect(result.missing).toEqual([]);
  });

  it("records a confirmed submission when the candidate submits", async () => {
    const session = fakeSession(complete, {
      waitForOutcome: async () => ({ confirmation: { confirmationText: "Thank you for applying" }, submitAttempted: true }),
    });

    expect(await runTask(payload(), session, options)).toMatchObject({
      outcome: "SUBMITTED",
      evidence: { confirmationText: "Thank you for applying" },
    });
  });

  it("auto-submits only when allowed and everything checked out", async () => {
    const session = fakeSession(complete);

    expect((await runTask(payload(), session, { ...options, autoSubmit: true })).outcome).toBe("UNCONFIRMED");
    expect(session.submit).toHaveBeenCalledTimes(1);
  });

  it("never auto-submits with missing fields, a captcha or a failed read-back", async () => {
    const missing = fakeSession([...complete, field("Gender", { required: true })]);
    const captcha = fakeSession(complete, { hasCaptcha: async () => true });
    const wrong = fakeSession(complete, { read: async () => "something else" });

    for (const session of [missing, captcha, wrong]) {
      await runTask(payload(), session, { ...options, autoSubmit: true });
      expect(session.submit).not.toHaveBeenCalled();
    }
  });

  it("never auto-submits an answer drafted by the assistant", async () => {
    const session = fakeSession([...complete, field("Describe your proudest project", { kind: "textarea", required: true })]);

    const result = await runTask(payload(), session, { ...options, autoSubmit: true, draftAnswer: async () => "A draft." });

    expect(session.submit).not.toHaveBeenCalled();
    expect(result.missing).toEqual([]);
  });

  it("reports a submission without confirmation as unconfirmed, never as submitted", async () => {
    const session = fakeSession(complete, { waitForOutcome: async () => ({ confirmation: null, submitAttempted: true }) });

    expect((await runTask(payload(), session, options)).outcome).toBe("UNCONFIRMED");
  });

  it("hands a page without a form to the candidate", async () => {
    expect((await runTask(payload(), fakeSession([]), options)).outcome).toBe("NEEDS_MANUAL_ACTION");
  });
});

function fakeApi(): HireLensApi {
  return {
    ping: vi.fn(async () => true),
    claim: vi.fn(),
    heartbeat: vi.fn(async () => true),
    report: vi.fn(async () => true),
    downloadResume: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
  };
}

describe("processTask", () => {
  it("hands unsupported sites back without opening a browser", async () => {
    const api = fakeApi();
    const openSession = vi.fn();

    const result = await processTask({ payload: payload({ task: { id: "t", platform: null, url: "https://x.test" } }), api, openSession, options, workDir: tmpdir() });

    expect(result.outcome).toBe("NEEDS_MANUAL_ACTION");
    expect(openSession).not.toHaveBeenCalled();
    expect(api.report).toHaveBeenCalledWith(result);
  });

  it("reports a crash after submitting as unconfirmed so nothing is retried", async () => {
    const api = fakeApi();
    const session = fakeSession(complete, {
      waitForOutcome: async () => {
        throw new Error("Browser closed");
      },
    });

    const result = await processTask({
      payload: payload(),
      api,
      openSession: async () => session,
      options: { autoSubmit: true, confirmTimeoutMs: 10 },
      workDir: tmpdir(),
    });

    expect(result.outcome).toBe("UNCONFIRMED");
  });

  it("reports a crash before submitting as failed", async () => {
    const api = fakeApi();

    const result = await processTask({
      payload: payload(),
      api,
      openSession: async () => {
        throw new Error("Page did not load");
      },
      options,
      workDir: tmpdir(),
    });

    expect(result).toMatchObject({ outcome: "FAILED", reason: expect.stringContaining("Page did not load") });
  });
});
