import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("global search wiring", () => {
  const dashboardLayout = read("app/(dashboard)/layout.tsx");
  const adminLayout = read("app/(admin)/layout.tsx");

  it("mounts the provider and trigger in the dashboard layout only", () => {
    expect(dashboardLayout).toContain("<SearchProvider");
    expect(dashboardLayout).toContain('<SearchTrigger variant="header" />');
    expect(adminLayout).not.toContain("SearchProvider");
  });

  it("builds admin commands on the server from the real identity", () => {
    expect(dashboardLayout).toContain("buildCommands({ isAdmin })");
    expect(dashboardLayout).toContain('const isAdmin = realRecord?.role === "ADMIN"');
    expect(dashboardLayout).toContain("getAccountRecord(realUser.id)");
  });

  it("never records or shows recent searches while impersonating", () => {
    expect(dashboardLayout).toContain("recentsUserId={impersonation ? null : realUser.id}");
  });

  it("places the trigger beside the notification bell", () => {
    expect(dashboardLayout).toMatch(/<SearchTrigger variant="header" \/>\s*<NotificationBell/);
  });

  it("adds a search row to the mobile drawer only", () => {
    const sidebar = read("components/layout/dashboard-sidebar.tsx");
    const matches = sidebar.match(/<SearchTrigger variant="row" \/>/g) ?? [];

    expect(matches).toHaveLength(1);
    expect(sidebar.indexOf('variant="row"')).toBeGreaterThan(
      sidebar.indexOf("Main navigation"),
    );
  });

  it("does not put the admin registry in any client component", () => {
    for (const file of [
      "features/search/components/search-palette.tsx",
      "features/search/components/search-provider.tsx",
      "features/search/components/search-trigger.tsx",
    ]) {
      const source = read(file);

      expect(source).not.toContain("adminCommandIds");
      expect(source).not.toContain("buildCommands");
      expect(source).not.toContain("/admin");
    }
  });
});

describe("palette safety and mobile behaviour", () => {
  const palette = read("features/search/components/search-palette.tsx");
  const provider = read("features/search/components/search-provider.tsx");
  const trigger = read("features/search/components/search-trigger.tsx");

  it("never renders markup from data", () => {
    for (const source of [palette, provider, trigger]) {
      expect(source).not.toContain("dangerouslySetInnerHTML");
      expect(source).not.toContain("innerHTML");
    }
  });

  it("only navigates to links that passed the internal-link check", () => {
    expect(palette).toContain("isSafeInternalHref(item.href)");
    expect(palette.indexOf("isSafeInternalHref(item.href)")).toBeLessThan(
      palette.indexOf("router.push(item.href)"),
    );
    expect(palette).not.toContain("window.location");
  });

  it("fetches the search route uncached with cancellation", () => {
    expect(palette).toContain("/api/search?q=");
    expect(palette).toContain('cache: "no-store"');
    expect(palette).toContain("AbortController");
    expect(palette).toContain("controller.abort()");
  });

  it("debounces through the shared 300ms hook, not per keystroke", () => {
    expect(palette).toContain("useDebouncedValue(query)");
  });

  it("uses combobox and listbox semantics", () => {
    expect(palette).toContain('role="combobox"');
    expect(palette).toContain('role="listbox"');
    expect(palette).toContain('role="option"');
    expect(palette).toContain("aria-activedescendant");
    expect(palette).toContain('aria-live="polite"');
  });

  it("is a full-screen sheet on mobile with a 16px input and safe-area padding", () => {
    expect(palette).toContain("h-dvh");
    expect(palette).toContain("text-[16px]");
    expect(palette).toContain("safe-area-inset-bottom");
    expect(palette).toContain('enterKeyHint="search"');
    expect(palette).toContain("min-h-11");
  });

  it("clears the result cache when the provider unmounts", () => {
    expect(provider).toContain("cache.clear()");
  });

  it("toggles on the shortcut and prevents the browser default", () => {
    expect(provider).toContain("isPaletteShortcut(event)");
    expect(provider).toContain("event.preventDefault()");
  });

  it("shows an icon on mobile and a labelled shortcut button on desktop", () => {
    expect(trigger).toContain("sm:hidden");
    expect(trigger).toContain("hidden h-9");
    expect(trigger).toContain('aria-keyshortcuts="Control+K Meta+K"');
  });
});

describe("search route", () => {
  const route = read("app/api/search/route.ts");

  it("is never cached and never static", () => {
    expect(route).toContain('export const dynamic = "force-dynamic"');
    expect(route).toContain('"Cache-Control": "no-store"');
  });

  it("resolves identity before doing any work", () => {
    expect(route.indexOf("resolveSearchIdentity()")).toBeLessThan(
      route.indexOf("runSearch("),
    );
  });

  it("does not expose admin content", () => {
    expect(route).not.toContain("admin");
    expect(read("features/search/server/search.repository.ts")).not.toContain("admin");
  });

  it("scopes every repository query by user id", () => {
    const repository = read("features/search/server/search.repository.ts");

    expect(repository.match(/userId, input\.userId/g)?.length).toBe(3);
  });
});
