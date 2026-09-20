import { describe, expect, it, vi } from "vitest";

const { executeMock, whereMock, selectMock } = vi.hoisted(() => {
  const executeMock = vi.fn();
  const whereMock = vi.fn();
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  return { executeMock, whereMock, selectMock };
});

vi.mock("@/lib/db/client", () => ({
  db: { execute: executeMock, select: selectMock },
}));

import {
  checkDatabase,
  countActiveAiReservations,
  countPendingInterviewPools,
  countRecentErrors,
  withTimeout,
} from "@/features/admin/server/system-health.service";

describe("withTimeout", () => {
  it("resolves when the work finishes before the timeout", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 50)).resolves.toBe("ok");
  });

  it("rejects when the work exceeds the timeout", async () => {
    const neverResolves = new Promise<never>(() => {});
    await expect(withTimeout(neverResolves, 20)).rejects.toThrow("timed out");
  });
});

describe("checkDatabase", () => {
  it("reports reachable with a latency when the query succeeds", async () => {
    executeMock.mockResolvedValueOnce(undefined);

    const result = await checkDatabase();

    expect(result.reachable).toBe(true);
    expect(result.latencyMs).not.toBeNull();
  });

  it("reports unreachable when the query rejects", async () => {
    executeMock.mockRejectedValueOnce(new Error("connection refused"));

    await expect(checkDatabase()).resolves.toEqual({
      reachable: false,
      latencyMs: null,
    });
  });
});

describe("backlog counts", () => {
  it("counts pending interview pools", async () => {
    whereMock.mockResolvedValueOnce([{ value: 3 }]);

    await expect(countPendingInterviewPools()).resolves.toBe(3);
  });

  it("counts active AI reservations", async () => {
    whereMock.mockResolvedValueOnce([{ value: 7 }]);

    await expect(countActiveAiReservations()).resolves.toBe(7);
  });

  it("counts recent errors", async () => {
    whereMock.mockResolvedValueOnce([{ value: 2 }]);

    await expect(countRecentErrors()).resolves.toBe(2);
  });

  it("defaults to 0 when the query returns no rows", async () => {
    whereMock.mockResolvedValueOnce([]);

    await expect(countPendingInterviewPools()).resolves.toBe(0);
  });
});
