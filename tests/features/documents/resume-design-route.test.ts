import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const saveResumeDesignSelection = vi.fn();

vi.mock("@/features/auth/server/require-database-user", () => ({
  requireDatabaseUser: async () => ({ id: "u1", name: null, email: "a@b.com" }),
}));

vi.mock("@/features/documents/server/resume-design.service", () => ({
  saveResumeDesignSelection: (input: unknown) =>
    saveResumeDesignSelection(input),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { POST } =
  await import("@/app/(dashboard)/dashboard/documents/[documentId]/design/route");

const DOCUMENT_ID = "6f9619ff-8b86-4d11-b42d-00c04fc964ff";
const ORIGIN = "https://hirelens.test";

function request(body: Record<string, string>, origin: string | null = ORIGIN) {
  const form = new FormData();

  for (const [key, value] of Object.entries(body)) {
    form.set(key, value);
  }

  return new Request(`${ORIGIN}/dashboard/documents/${DOCUMENT_ID}/design`, {
    method: "POST",
    body: form,
    headers: origin ? { origin } : {},
  });
}

const params = { params: Promise.resolve({ documentId: DOCUMENT_ID }) };
const MODERN = {
  template: "MODERN",
  typography: "SOURCE_SERIF_4",
  spacing: "COMPACT",
};

beforeEach(() => {
  saveResumeDesignSelection.mockReset();
});

describe("POST /dashboard/documents/[documentId]/design", () => {
  it("saves the design for the signed-in user", async () => {
    saveResumeDesignSelection.mockResolvedValue({ ok: true });

    const response = await POST(request(MODERN), params);

    expect(response.status).toBe(204);
    expect(saveResumeDesignSelection).toHaveBeenCalledWith({
      userId: "u1",
      publicId: DOCUMENT_ID,
      selection: MODERN,
    });
  });

  it("rejects requests from another site", async () => {
    const response = await POST(
      request(MODERN, "https://attacker.example"),
      params,
    );

    expect(response.status).toBe(403);
    expect(saveResumeDesignSelection).not.toHaveBeenCalled();
  });

  it("rejects a design that does not exist", async () => {
    const response = await POST(
      request({ ...MODERN, template: "COMIC_SANS" }),
      params,
    );

    expect(response.status).toBe(400);
    expect(saveResumeDesignSelection).not.toHaveBeenCalled();
  });

  it("reports a document the user does not own as missing", async () => {
    saveResumeDesignSelection.mockResolvedValue({ ok: false });

    const response = await POST(request(MODERN), params);

    expect(response.status).toBe(404);
  });
});

describe("resume design controls", () => {
  const controls = readFileSync(
    "features/documents/components/resume-design-controls.tsx",
    "utf8",
  );

  it("sends a pending choice when the page is hidden", () => {
    expect(controls).toContain('addEventListener("pagehide", sendPending)');
    expect(controls).toContain("navigator.sendBeacon(");
    expect(controls).toContain("/dashboard/documents/${publicId}/design");
  });

  it("sends a pending choice when the controls unmount", () => {
    const effect = controls.slice(
      controls.indexOf('addEventListener("pagehide", sendPending)'),
    );

    expect(effect).toMatch(
      /removeEventListener\("pagehide", sendPending\);\s*sendPending\(\);/,
    );
  });
});
