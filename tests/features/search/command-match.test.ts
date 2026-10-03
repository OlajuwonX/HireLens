import {
  defaultCommands,
  matchCommands,
  normalizeForMatch,
  scoreCommand,
} from "@/features/search/command-match";
import { buildCommands } from "@/features/search/registry";
import { describe, expect, it } from "vitest";

const commands = buildCommands({ isAdmin: false });

function labels(query: string) {
  return matchCommands(commands, query).map((command) => command.label);
}

describe("normalizeForMatch", () => {
  it("lowercases, strips accents and punctuation, collapses spaces", () => {
    expect(normalizeForMatch("  Résumé,   Add-a CV! ")).toBe("resume add a cv");
  });
});

describe("matchCommands", () => {
  it("finds the password command from a synonym", () => {
    expect(labels("password")).toContain("Add or change password");
    expect(labels("security")).toContain("Add or change password");
  });

  it("finds verify email", () => {
    expect(labels("verify")).toContain("Verify your email");
    expect(labels("verify email")[0]).toBe("Verify your email");
  });

  it("ranks a label prefix above a keyword match", () => {
    expect(labels("resu")[0]).toBe("Resumes");
  });

  it("matches every word of a multi-word query", () => {
    expect(labels("add resume")).toContain("Add a resume");
    expect(labels("add zzzzz")).toEqual([]);
  });

  it("is case and accent insensitive", () => {
    expect(labels("PASSWORD")).toEqual(labels("password"));
    expect(labels("résumé")).toContain("Resumes");
  });

  it("returns nothing for a blank query", () => {
    expect(matchCommands(commands, "   ")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(matchCommands(commands, "a", 3).length).toBeLessThanOrEqual(3);
  });

  it("orders ties alphabetically so results are stable", () => {
    const first = labels("account");
    const second = labels("account");

    expect(first).toEqual(second);
  });

  it("does not match admin pages for a non-admin", () => {
    expect(labels("audit")).toEqual([]);
    expect(labels("admin")).toEqual([]);
  });

  it("matches admin pages for an admin", () => {
    const adminCommands = buildCommands({ isAdmin: true });
    const results = matchCommands(adminCommands, "audit").map(
      (command) => command.label,
    );

    expect(results).toContain("Admin: Audit log");
  });
});

describe("scoreCommand", () => {
  it("scores zero when any token is missing", () => {
    const command = commands.find((entry) => entry.id === "page-jobs")!;

    expect(scoreCommand(command, "saved nonsense")).toBe(0);
    expect(scoreCommand(command, "saved")).toBeGreaterThan(0);
  });
});

describe("defaultCommands", () => {
  it("offers quick actions for the empty state", () => {
    const defaults = defaultCommands(commands);

    expect(defaults.length).toBeGreaterThan(0);
    expect(defaults.every((command) => command.group !== "admin")).toBe(true);
  });

  it("never invents commands the caller cannot see", () => {
    const defaults = defaultCommands([]);

    expect(defaults).toEqual([]);
  });
});
