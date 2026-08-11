import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn keeps font size and text colour apart", () => {
  it.each([
    ["text-label", "compact"],
    ["text-meta", "row"],
    ["text-system", "system"],
    ["text-body", "body"],
    ["text-card-metric", "metric"],
  ])("a %s size does not strip the text colour (%s)", (size) => {
    expect(cn(`bg-accent text-accent-text ${size}`)).toContain(
      "text-accent-text",
    );
  });

  it("keeps every semantic foreground alongside a size", () => {
    for (const colour of [
      "text-accent-text",
      "text-danger-text",
      "text-warning-text",
      "text-info-text",
      "text-action-dark-text",
    ]) {
      expect(cn(`${colour} text-label`)).toContain(colour);
    }
  });
});

describe("cn still merges within a group", () => {
  it("takes the last text colour", () => {
    expect(cn("text-accent-text", "text-danger")).toBe("text-danger");
  });

  it("takes the last font size", () => {
    expect(cn("text-meta", "text-label")).toBe("text-label");
  });

  it("takes the last background", () => {
    expect(cn("bg-accent", "bg-danger")).toBe("bg-danger");
  });

  it("lets a caller override a variant colour", () => {
    expect(cn("bg-accent text-accent-text", "text-text-primary")).toBe(
      "bg-accent text-text-primary",
    );
  });
});
