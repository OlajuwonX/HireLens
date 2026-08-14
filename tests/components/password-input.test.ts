import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    return statSync(full).isDirectory()
      ? walk(full)
      : /\.tsx$/.test(entry)
        ? [full]
        : [];
  });
}

const sources = ["app", "features", "components"].flatMap((root) => walk(root));

describe("every password field uses the shared control", () => {
  it("no component hardcodes a password input", () => {
    const offenders = sources.filter(
      (file) =>
        !file.endsWith("password-input.tsx") &&
        readFileSync(file, "utf8").includes('type="password"'),
    );

    expect(offenders).toEqual([]);
  });

  it("the auth forms use PasswordInput", () => {
    for (const file of [
      "features/auth/components/sign-in-form.tsx",
      "features/auth/components/sign-up-form.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).toContain("<PasswordInput");
    }
  });
});

describe("the toggle is accessible and does not submit", () => {
  const source = readFileSync("components/ui/password-input.tsx", "utf8");

  it("is a non-submitting button", () => {
    expect(source).toContain('type="button"');
  });

  it("announces its state and what it controls", () => {
    expect(source).toContain("aria-label");
    expect(source).toContain("aria-pressed={showPassword}");
    expect(source).toContain("aria-controls={inputId}");
  });

  it("keeps the icon decorative", () => {
    expect(source).toContain("aria-hidden");
  });

  it("stays out of the tab order so typing flows to the next field", () => {
    expect(source).toContain("tabIndex={-1}");
  });

  it("defaults to hidden", () => {
    expect(source).toContain("useState(false)");
  });

  it("never accepts a caller-supplied type", () => {
    expect(source).toContain('Omit<InputProps, "type">');
  });

  it("reserves room so the icon never overlaps the value", () => {
    expect(source).toContain("pr-11");
  });
});
