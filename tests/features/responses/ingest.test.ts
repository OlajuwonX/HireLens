import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  existingMessageIds: vi.fn(),
  insertEmailEvent: vi.fn(),
  listApplicationCandidates: vi.fn(),
  ensurePendingPrep: vi.fn(),
  generatePrep: vi.fn(),
  recordApplicationActivity: vi.fn(),
  notifyUser: vi.fn(),
}));

vi.mock("@/features/responses/server/email.repository", () => ({
  existingMessageIds: mocks.existingMessageIds,
  insertEmailEvent: mocks.insertEmailEvent,
  listApplicationCandidates: mocks.listApplicationCandidates,
}));
vi.mock("@/features/responses/server/prep.repository", () => ({ ensurePendingPrep: mocks.ensurePendingPrep }));
vi.mock("@/features/responses/server/prep.service", () => ({ generatePrep: mocks.generatePrep }));
vi.mock("@/features/applications/server/application.repository", () => ({
  recordApplicationActivity: mocks.recordApplicationActivity,
}));
vi.mock("@/features/notifications/server/notification.service", () => ({ notifyUser: mocks.notifyUser }));

const { ingestEmails } = await import("@/features/responses/server/ingest.service");

const email = (messageId: string, subject: string, from = "talent@stripe.com", text = "") => ({
  messageId,
  from,
  subject,
  text,
  receivedAt: "2026-11-12T10:00:00.000Z",
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.existingMessageIds.mockResolvedValue(new Set());
  mocks.listApplicationCandidates.mockResolvedValue([{ id: "app-1", publicId: "p", company: "Stripe", title: "Frontend Engineer" }]);
  mocks.insertEmailEvent.mockImplementation(async (values) => ({ id: `event-${values.messageId}`, ...values }));
  mocks.ensurePendingPrep.mockResolvedValue({ id: "prep-1", applicationId: "app-1" });
  mocks.generatePrep.mockResolvedValue({ ok: true });
});

const ingest = (emails: ReturnType<typeof email>[]) => ingestEmails({ userId: "user-1", emails });

describe("ingestEmails", () => {
  it("turns an interview invitation into a priority notification and preparation", async () => {
    const report = await ingest([email("m1", "We'd like to invite you to an interview", undefined, "Book a time below.")]);

    expect(report).toMatchObject({ stored: 1, priority: 1, prepared: 1 });
    expect(mocks.insertEmailEvent).toHaveBeenCalledWith(expect.objectContaining({ kind: "INTERVIEW", status: "AUTO", applicationId: "app-1" }));
    expect(mocks.notifyUser).toHaveBeenCalledWith(expect.objectContaining({ title: "Interview invitation from Stripe", applicationId: "app-1" }));
    expect(mocks.generatePrep).toHaveBeenCalledWith(expect.objectContaining({ emailText: "Book a time below." }));
  });

  it("stores only a short snippet, never the full email", async () => {
    await ingest([email("m1", "Thank you for applying", undefined, "x".repeat(5_000))]);

    expect(mocks.insertEmailEvent.mock.calls[0][0].snippet.length).toBe(300);
  });

  it("skips messages it has already seen", async () => {
    mocks.existingMessageIds.mockResolvedValue(new Set(["m1"]));

    expect(await ingest([email("m1", "Interview invitation")])).toMatchObject({ stored: 0, duplicates: 1 });
    expect(mocks.insertEmailEvent).not.toHaveBeenCalled();
  });

  it("sends uncertain or unmatched messages to review without acting on them", async () => {
    await ingest([
      email("m1", "Tips for your next interview"),
      email("m2", "Invitation to interview", "someone@unknown.com"),
    ]);

    expect(mocks.insertEmailEvent.mock.calls.map(([values]) => values.status)).toEqual(["NEEDS_REVIEW", "NEEDS_REVIEW"]);
    expect(mocks.notifyUser).not.toHaveBeenCalled();
    expect(mocks.generatePrep).not.toHaveBeenCalled();
  });

  it("records a rejection quietly without preparing anything", async () => {
    await ingest([email("m1", "Your application", undefined, "Unfortunately we will not be moving forward.")]);

    expect(mocks.recordApplicationActivity).toHaveBeenCalledWith(expect.objectContaining({ title: "Rejection received" }));
    expect(mocks.notifyUser).toHaveBeenCalledWith(expect.objectContaining({ title: "Update from Stripe" }));
    expect(mocks.generatePrep).not.toHaveBeenCalled();
  });

  it("prepares at most one interview per batch to stay within time and quota", async () => {
    const report = await ingest([
      email("m1", "Invitation to interview"),
      email("m2", "We would like to schedule an interview"),
    ]);

    expect(report.priority).toBe(2);
    expect(mocks.generatePrep).toHaveBeenCalledTimes(1);
  });

  it("still records the email when preparation fails", async () => {
    mocks.generatePrep.mockResolvedValue({ ok: false, message: "Limit" });

    expect(await ingest([email("m1", "Invitation to interview")])).toMatchObject({ stored: 1, prepared: 0 });
  });
});
