import { describe, expect, it } from "vitest";
import { pickOption } from "../src/browser/options";
import { cleanDraft, draftPrompt } from "../src/claude/writer";
import { readConfig } from "../src/config";
import { RESUME_FILE } from "../src/execution/fields";
import { detectCaptcha, detectConfirmation } from "../src/verification/confirmation";
import { matchesExpected, verifyFills } from "../src/verification/read-back";
import { field, payload } from "./helpers";

describe("pickOption", () => {
  it("prefers exact, then prefix, then contained matches", () => {
    expect(pickOption(["Yes", "No"], "yes")).toBe("Yes");
    expect(pickOption(["Select...", "Yes, I am authorized", "No"], "Yes")).toBe("Yes, I am authorized");
    expect(pickOption(["Lagos, Nigeria", "London"], "Nigeria")).toBe("Lagos, Nigeria");
    expect(pickOption(["Yes", "No"], "Maybe")).toBeNull();
  });
});

describe("read-back verification", () => {
  it("compares text ignoring case and punctuation", () => {
    expect(matchesExpected({ field: field("Email"), value: "ada@example.com", source: "profile" }, "ADA@example.com")).toBe(true);
    expect(matchesExpected({ field: field("Email"), value: "ada@example.com", source: "profile" }, "")).toBe(false);
  });

  it("accepts the option label chosen for a select", () => {
    const fill = { field: field("Auth", { kind: "select" as const }), value: "Yes", source: "profile" as const };

    expect(matchesExpected(fill, "Yes, I am authorized")).toBe(true);
    expect(matchesExpected(fill, "No")).toBe(false);
  });

  it("checks that the resume is attached", () => {
    const fill = { field: field("Resume", { kind: "file" as const }), value: RESUME_FILE, source: "resume" as const };

    expect(matchesExpected(fill, "attached")).toBe(true);
    expect(matchesExpected(fill, "")).toBe(false);
  });

  it("lists every field that did not take", async () => {
    const fills = [
      { field: field("First Name"), value: "Ada", source: "profile" as const },
      { field: field("Last Name"), value: "Obi", source: "profile" as const },
    ];

    expect(await verifyFills(fills, async (fill) => (fill.field.label === "First Name" ? "Ada" : "Obbi"))).toEqual(["Last Name"]);
  });
});

describe("confirmation and captcha detection", () => {
  it("recognises common confirmation messages", () => {
    expect(detectConfirmation({ url: "https://x.test/apply", text: "Thank you for applying to Acme!" })?.confirmationText).toBe("Thank you for applying");
    expect(detectConfirmation({ url: "https://x.test/apply", text: "Your application has been submitted." })).not.toBeNull();
  });

  it("recognises a confirmation page by its address", () => {
    expect(detectConfirmation({ url: "https://x.test/jobs/1/confirmation", text: "" })).toEqual({ finalUrl: "https://x.test/jobs/1/confirmation" });
  });

  it("does not mistake the form page for a confirmation", () => {
    expect(detectConfirmation({ url: "https://x.test/jobs/1", text: "Apply for this job. Submit application" })).toBeNull();
  });

  it("spots captchas", () => {
    expect(detectCaptcha({ html: '<div class="g-recaptcha"></div>' })).toBe(true);
    expect(detectCaptcha({ html: "<form></form>" })).toBe(false);
  });
});

describe("worker configuration", () => {
  const env = { HIRELENS_URL: "https://hirelens.test/", HIRELENS_WORKER_TOKEN: "hlw_abc" };

  it("defaults to safe settings", () => {
    expect(readConfig(env)).toMatchObject({
      HIRELENS_URL: "https://hirelens.test",
      AUTO_SUBMIT: false,
      USE_CLAUDE: false,
      BROWSER_CHANNEL: "chrome",
    });
  });

  it("explains a bad token", () => {
    expect(() => readConfig({ ...env, HIRELENS_WORKER_TOKEN: "oops" })).toThrow(/Settings > Local worker/);
  });
});

describe("Claude Code drafts", () => {
  it("tells the assistant to use only supplied facts", () => {
    const prompt = draftPrompt(payload(), "Why Acme?");

    expect(prompt).toContain("Never invent");
    expect(prompt).toContain("Question: Why Acme?");
  });

  it("drops empty or skipped drafts", () => {
    expect(cleanDraft("SKIP")).toBeNull();
    expect(cleanDraft("  ")).toBeNull();
    expect(cleanDraft("I like payments.")).toBe("I like payments.");
  });
});
