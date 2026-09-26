import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { adminNavigation } from "@/components/layout/navigation";
import {
  adminCommandIds,
  baseCommandIds,
  buildCommands,
} from "@/features/search/registry";
import { isSafeInternalHref } from "@/features/search/safe-href";
import { describe, expect, it } from "vitest";

function collectPageRoutes(dir: string, base = ""): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      const isGroup = entry.startsWith("(") && entry.endsWith(")");

      return collectPageRoutes(full, isGroup ? base : `${base}/${entry}`);
    }

    return entry === "page.tsx" ? [base === "" ? "/" : base] : [];
  });
}

const routes = new Set(collectPageRoutes("app"));

function pathOf(href: string) {
  return href.split("?")[0]!.split("#")[0]!;
}

describe("command registry integrity", () => {
  const everything = buildCommands({ isAdmin: true });

  it("has unique ids", () => {
    const ids = everything.map((command) => command.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every command at a page that exists", () => {
    for (const command of everything) {
      expect(routes.has(pathOf(command.href)), `${command.id} -> ${command.href}`).toBe(
        true,
      );
    }
  });

  it("only uses safe internal links", () => {
    for (const command of everything) {
      expect(isSafeInternalHref(command.href), command.id).toBe(true);
    }
  });

  it("gives every command a label and at least one keyword or description", () => {
    for (const command of everything) {
      expect(command.label.length).toBeGreaterThan(0);
      expect(command.keywords.length + (command.description ? 1 : 0)).toBeGreaterThan(0);
    }
  });

  it("keeps destructive account actions as navigation to settings only", () => {
    const destructive = everything.filter((command) =>
      ["account-pause", "account-delete"].includes(command.id),
    );

    expect(destructive).toHaveLength(2);

    for (const command of destructive) {
      expect(command.href).toBe("/settings/account");
    }
  });
});

describe("admin gating", () => {
  it("excludes every admin command for a non-admin", () => {
    const commands = buildCommands({ isAdmin: false });
    const ids = commands.map((command) => command.id);

    for (const id of adminCommandIds) {
      expect(ids).not.toContain(id);
    }

    expect(commands.some((command) => command.group === "admin")).toBe(false);
  });

  it("includes every admin command for an admin", () => {
    const ids = buildCommands({ isAdmin: true }).map((command) => command.id);

    for (const id of adminCommandIds) {
      expect(ids).toContain(id);
    }
  });

  it("never leaks admin destinations into the non-admin serialized list", () => {
    const serialized = JSON.stringify(buildCommands({ isAdmin: false }));

    expect(serialized).not.toContain("/admin");
    expect(serialized).not.toContain("/ops-console");
  });

  it("keeps base commands available to admins too", () => {
    const ids = buildCommands({ isAdmin: true }).map((command) => command.id);

    for (const id of baseCommandIds) {
      expect(ids).toContain(id);
    }
  });

  it("covers every ready admin navigation entry", () => {
    const hrefs = buildCommands({ isAdmin: true }).map((command) => command.href);

    for (const item of adminNavigation) {
      expect(hrefs, item.label).toContain(item.href);
    }
  });

  it("only ever points admin commands at admin routes", () => {
    for (const command of buildCommands({ isAdmin: true })) {
      if (command.group === "admin") {
        expect(
          command.href.startsWith("/admin") || command.href === "/ops-console",
        ).toBe(true);
      }
    }
  });
});
