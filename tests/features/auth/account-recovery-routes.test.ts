import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BLOCKED_ACCOUNT_ROUTES } from "@/features/auth/account-state";

const appDir = join(process.cwd(), "app");
const layout = readFileSync(join(appDir, "account", "layout.tsx"), "utf8");

describe("account recovery routes", () => {
  it("has a page for every blocked account state", () => {
    for (const route of Object.values(BLOCKED_ACCOUNT_ROUTES)) {
      const page = join(appDir, `${route}`, "page.tsx");

      expect(existsSync(page), `${route} has no page.tsx`).toBe(true);
    }
  });

  it("never calls the account-state guard, which would loop forever", () => {
    expect(layout).not.toContain("requireDatabaseUser");
    expect(layout).not.toContain("requireVerifiedDatabaseUser");
  });

  it("still requires a session so the pages are not public", () => {
    expect(layout).toContain("requireCurrentUser");
  });

  it("keeps the recovery pages out of the dashboard route group", () => {
    for (const route of Object.values(BLOCKED_ACCOUNT_ROUTES)) {
      expect(existsSync(join(appDir, "(dashboard)", route))).toBe(false);
    }
  });

  it("asks search engines not to index a recovery page", () => {
    for (const route of Object.values(BLOCKED_ACCOUNT_ROUTES)) {
      const page = readFileSync(join(appDir, `${route}`, "page.tsx"), "utf8");

      expect(page).toContain("index: false");
    }
  });
});
