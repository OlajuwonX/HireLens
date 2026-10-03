import { describe, expect, it, vi } from "vitest";

const {
  searchResumeRowsMock,
  searchJobRowsMock,
  searchDocumentRowsMock,
  authMock,
  getAccountRecordMock,
  resolveSearchIdentityMock,
  runSearchMock,
  captureExceptionMock,
} = vi.hoisted(() => ({
  searchResumeRowsMock: vi.fn(),
  searchJobRowsMock: vi.fn(),
  searchDocumentRowsMock: vi.fn(),
  authMock: vi.fn(),
  getAccountRecordMock: vi.fn(),
  resolveSearchIdentityMock: vi.fn(),
  runSearchMock: vi.fn(),
  captureExceptionMock: vi.fn(),
}));

vi.mock("@/features/search/server/search.repository", () => ({
  searchResumeRows: searchResumeRowsMock,
  searchJobRows: searchJobRowsMock,
  searchDocumentRows: searchDocumentRowsMock,
}));
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/features/auth/server/current-account", () => ({
  getAccountRecord: getAccountRecordMock,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: captureExceptionMock }));

import {
  documentTypeLabel,
  mapSearchResults,
  matchingDocumentTypes,
} from "@/features/search/server/search.mapper";
import { runSearch } from "@/features/search/server/search.service";
import { resolveSearchIdentity } from "@/features/search/server/search-identity";

const DOCUMENT_TYPES = [
  "IMPROVED_RESUME",
  "COVER_LETTER",
  "APPLICATION_EMAIL",
  "FOLLOW_UP_EMAIL",
  "FOLLOW_UP_MESSAGE",
  "KEYWORD_ANALYSIS",
] as const;

describe("matchingDocumentTypes", () => {
  it("matches a document type by its label", () => {
    expect(matchingDocumentTypes("cover letter", DOCUMENT_TYPES)).toEqual([
      "COVER_LETTER",
    ]);
  });

  it("matches several related types", () => {
    expect(matchingDocumentTypes("follow", DOCUMENT_TYPES)).toEqual([
      "FOLLOW_UP_EMAIL",
      "FOLLOW_UP_MESSAGE",
    ]);
  });

  it("matches application email", () => {
    expect(matchingDocumentTypes("application email", DOCUMENT_TYPES)).toContain(
      "APPLICATION_EMAIL",
    );
  });

  it("matches nothing for an unrelated or blank query", () => {
    expect(matchingDocumentTypes("plumber", DOCUMENT_TYPES)).toEqual([]);
    expect(matchingDocumentTypes("  ", DOCUMENT_TYPES)).toEqual([]);
  });
});

describe("documentTypeLabel", () => {
  it("uses the curated label and falls back to a readable one", () => {
    expect(documentTypeLabel("COVER_LETTER")).toBe("Cover letter");
    expect(documentTypeLabel("SOME_NEW_TYPE")).toBe("Some New Type");
  });
});

describe("mapSearchResults", () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";

  it("builds internal links from ids only", () => {
    const result = mapSearchResults({
      resumes: [{ publicId: id, title: "Frontend" }],
      jobs: [{ publicId: id, title: "Engineer", company: "Acme", location: "Remote" }],
      documents: [{ publicId: id, type: "COVER_LETTER", jobTitle: "Engineer", jobCompany: "Acme" }],
    });

    expect(result.resumes[0]!.href).toBe(`/dashboard/resumes/${id}`);
    expect(result.jobs[0]!.href).toBe(`/dashboard/jobs?open=${id}`);
    expect(result.documents[0]!.href).toBe(`/dashboard/documents/${id}`);
  });

  it("describes jobs and documents readably", () => {
    const result = mapSearchResults({
      resumes: [],
      jobs: [
        { publicId: id, title: "Engineer", company: "Acme", location: null },
        { publicId: id, title: "Designer", company: "Beta", location: "Leeds" },
      ],
      documents: [
        { publicId: id, type: "COVER_LETTER", jobTitle: null, jobCompany: null },
      ],
    });

    expect(result.jobs[0]!.subtitle).toBe("Acme");
    expect(result.jobs[1]!.subtitle).toBe("Beta · Leeds");
    expect(result.documents[0]!.title).toBe("Cover letter");
    expect(result.documents[0]!.subtitle).toBe("No linked job");
  });
});

describe("runSearch", () => {
  it("returns empty results without touching the database for a short query", async () => {
    const result = await runSearch("user-1", "a");

    expect(result).toEqual({ resumes: [], jobs: [], documents: [] });
    expect(searchResumeRowsMock).not.toHaveBeenCalled();
    expect(searchJobRowsMock).not.toHaveBeenCalled();
    expect(searchDocumentRowsMock).not.toHaveBeenCalled();
  });

  it("returns empty results for null and blank queries", async () => {
    expect(await runSearch("user-1", null)).toEqual({ resumes: [], jobs: [], documents: [] });
    expect(await runSearch("user-1", "   ")).toEqual({ resumes: [], jobs: [], documents: [] });
  });

  it("scopes every query to the calling user with an escaped pattern", async () => {
    searchResumeRowsMock.mockResolvedValue([]);
    searchJobRowsMock.mockResolvedValue([]);
    searchDocumentRowsMock.mockResolvedValue([]);

    await runSearch("user-7", "100%_done");

    for (const mock of [searchResumeRowsMock, searchJobRowsMock, searchDocumentRowsMock]) {
      expect(mock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-7",
          pattern: "%100\\%\\_done%",
          limit: 5,
        }),
      );
    }
  });

  it("passes matching document types for a type-name query", async () => {
    searchResumeRowsMock.mockResolvedValue([]);
    searchJobRowsMock.mockResolvedValue([]);
    searchDocumentRowsMock.mockResolvedValue([]);

    await runSearch("user-1", "cover letter");

    expect(searchDocumentRowsMock).toHaveBeenCalledWith(
      expect.objectContaining({ types: ["COVER_LETTER"] }),
    );
  });

  it("maps repository rows into grouped results", async () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";

    searchResumeRowsMock.mockResolvedValue([{ publicId: id, title: "Frontend" }]);
    searchJobRowsMock.mockResolvedValue([]);
    searchDocumentRowsMock.mockResolvedValue([]);

    const result = await runSearch("user-1", "frontend");

    expect(result.resumes).toHaveLength(1);
    expect(result.jobs).toEqual([]);
  });
});

describe("resolveSearchIdentity", () => {
  const session = { user: { email: "a@b.com" }, dbUserId: "real-1", impersonation: null };

  it("is unauthenticated without a session or user id", async () => {
    authMock.mockResolvedValueOnce(null);
    expect(await resolveSearchIdentity()).toEqual({ status: "unauthenticated" });

    authMock.mockResolvedValueOnce({ user: { email: "a@b.com" }, dbUserId: null });
    expect(await resolveSearchIdentity()).toEqual({ status: "unauthenticated" });
  });

  it("is unauthenticated when the account no longer exists", async () => {
    authMock.mockResolvedValueOnce(session);
    getAccountRecordMock.mockResolvedValueOnce(null);

    expect(await resolveSearchIdentity()).toEqual({ status: "unauthenticated" });
  });

  it("blocks disabled and deleted accounts", async () => {
    authMock.mockResolvedValueOnce(session);
    getAccountRecordMock.mockResolvedValueOnce({ id: "real-1", disabledAt: new Date(), deletedAt: null });
    expect(await resolveSearchIdentity()).toEqual({ status: "blocked" });

    authMock.mockResolvedValueOnce(session);
    getAccountRecordMock.mockResolvedValueOnce({ id: "real-1", disabledAt: null, deletedAt: new Date() });
    expect(await resolveSearchIdentity()).toEqual({ status: "blocked" });
  });

  it("uses the real account for a normal session", async () => {
    authMock.mockResolvedValueOnce(session);
    getAccountRecordMock.mockResolvedValueOnce({ id: "real-1", disabledAt: null, deletedAt: null });

    expect(await resolveSearchIdentity()).toEqual({ status: "ok", userId: "real-1" });
  });

  it("follows the data identity while impersonating", async () => {
    authMock.mockResolvedValueOnce({
      ...session,
      impersonation: { actingAdminId: "real-1", targetUserId: "target-9", expiresAt: "x" },
    });
    getAccountRecordMock
      .mockResolvedValueOnce({ id: "real-1", disabledAt: null, deletedAt: null })
      .mockResolvedValueOnce({ id: "target-9" });

    expect(await resolveSearchIdentity()).toEqual({ status: "ok", userId: "target-9" });
  });

  it("falls back to the real account if the impersonation target is gone", async () => {
    authMock.mockResolvedValueOnce({
      ...session,
      impersonation: { actingAdminId: "real-1", targetUserId: "gone", expiresAt: "x" },
    });
    getAccountRecordMock
      .mockResolvedValueOnce({ id: "real-1", disabledAt: null, deletedAt: null })
      .mockResolvedValueOnce(null);

    expect(await resolveSearchIdentity()).toEqual({ status: "ok", userId: "real-1" });
  });
});

describe("GET /api/search", () => {
  async function load() {
    vi.resetModules();
    vi.doMock("@/features/search/server/search-identity", () => ({
      resolveSearchIdentity: resolveSearchIdentityMock,
    }));
    vi.doMock("@/features/search/server/search.service", () => ({
      runSearch: runSearchMock,
    }));

    return import("@/app/api/search/route");
  }

  it("returns 401 with no-store when signed out", async () => {
    resolveSearchIdentityMock.mockResolvedValueOnce({ status: "unauthenticated" });
    const { GET } = await load();
    const response = await GET(new Request("http://localhost/api/search?q=react"));

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(runSearchMock).not.toHaveBeenCalled();
  });

  it("returns 403 for a blocked account", async () => {
    resolveSearchIdentityMock.mockResolvedValueOnce({ status: "blocked" });
    const { GET } = await load();
    const response = await GET(new Request("http://localhost/api/search?q=react"));

    expect(response.status).toBe(403);
    expect(runSearchMock).not.toHaveBeenCalled();
  });

  it("searches as the resolved user and never caches the response", async () => {
    resolveSearchIdentityMock.mockResolvedValueOnce({ status: "ok", userId: "user-5" });
    runSearchMock.mockResolvedValueOnce({ resumes: [], jobs: [], documents: [] });
    const { GET } = await load();
    const response = await GET(new Request("http://localhost/api/search?q=react"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(runSearchMock).toHaveBeenCalledWith("user-5", "react");
    expect(await response.json()).toEqual({ resumes: [], jobs: [], documents: [] });
  });

  it("hands a missing q to the service, which returns nothing", async () => {
    resolveSearchIdentityMock.mockResolvedValueOnce({ status: "ok", userId: "user-5" });
    runSearchMock.mockResolvedValueOnce({ resumes: [], jobs: [], documents: [] });
    const { GET } = await load();

    await GET(new Request("http://localhost/api/search"));

    expect(runSearchMock).toHaveBeenCalledWith("user-5", null);
  });

  it("returns a generic 500 and reports the error without leaking details", async () => {
    resolveSearchIdentityMock.mockResolvedValueOnce({ status: "ok", userId: "user-5" });
    runSearchMock.mockRejectedValueOnce(new Error("connection string leaked"));
    const { GET } = await load();
    const response = await GET(new Request("http://localhost/api/search?q=react"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("connection string");
    expect(captureExceptionMock).toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
