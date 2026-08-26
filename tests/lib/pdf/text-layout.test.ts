import { describe, expect, it } from "vitest";
import {
  formatDateRange,
  joinNonEmpty,
  sanitizePdfText,
  wrapText,
} from "@/lib/pdf/text-layout";

const measure = (text: string) => text.length;

describe("sanitizePdfText", () => {
  it("keeps smart punctuation the embedded fonts can render", () => {
    expect(sanitizePdfText("It’s a “quote” — really…")).toBe(
      "It’s a “quote” — really…",
    );
  });

  it("preserves accented and extended Latin names", () => {
    expect(sanitizePdfText("José Müller Łukasz Đorđe")).toBe(
      "José Müller Łukasz Đorđe",
    );
  });

  it("preserves Vietnamese diacritics", () => {
    expect(sanitizePdfText("Nguyễn Thị")).toBe("Nguyễn Thị");
  });

  it("drops characters no Latin font can render", () => {
    expect(sanitizePdfText("Résumé 🚀 ok")).toBe("Résumé ok");
  });

  it("normalises middots to bullets and collapses runs of spaces", () => {
    expect(sanitizePdfText("· one  two")).toBe("• one two");
  });

  it("normalises non-breaking spaces", () => {
    expect(sanitizePdfText("a b")).toBe("a b");
  });

  it("normalises CRLF to LF", () => {
    expect(sanitizePdfText("a\r\nb")).toBe("a\nb");
  });
});

describe("wrapText", () => {
  it("returns nothing for blank input", () => {
    expect(wrapText("   ", measure, 10)).toEqual([]);
  });

  it("keeps text on one line when it fits", () => {
    expect(wrapText("hello", measure, 10)).toEqual(["hello"]);
  });

  it("wraps on word boundaries", () => {
    expect(wrapText("aaa bbb ccc", measure, 7)).toEqual(["aaa bbb", "ccc"]);
  });

  it("never exceeds the maximum width", () => {
    const lines = wrapText(
      "the quick brown fox jumps over the lazy dog",
      measure,
      12,
    );

    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(12);
    }
  });

  it("breaks a word that cannot fit on any line", () => {
    const lines = wrapText("abcdefghij", measure, 4);

    expect(lines).toEqual(["abcd", "efgh", "ij"]);
  });

  it("keeps a broken word joined to the following text", () => {
    const lines = wrapText("abcdefgh xy", measure, 4);

    expect(lines.join("")).toContain("abcdefgh");
    expect(lines.at(-1)).toContain("xy");
  });

  it("treats newlines as hard breaks", () => {
    expect(wrapText("one\ntwo", measure, 40)).toEqual(["one", "two"]);
  });

  it("loses no words", () => {
    const source = "alpha beta gamma delta epsilon zeta eta theta";
    const joined = wrapText(source, measure, 11).join(" ");

    expect(joined.split(/\s+/)).toEqual(source.split(" "));
  });

  it("still wraps when the caller passes a width of zero or less", () => {
    const lines = wrapText("alpha beta gamma delta", measure, 0);

    expect(lines.length).toBeGreaterThan(1);

    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(8);
    }
  });
});

describe("joinNonEmpty", () => {
  it("skips nulls and blanks", () => {
    expect(joinNonEmpty(["a", null, "", "  ", "b"], " | ")).toBe("a | b");
  });
});

describe("formatDateRange", () => {
  it("joins a closed range", () => {
    expect(formatDateRange("2019", "2024")).toBe("2019 – 2024");
  });

  it("treats a missing end date as present", () => {
    expect(formatDateRange("2019", null)).toBe("2019 – Present");
  });

  it("returns the end alone when there is no start", () => {
    expect(formatDateRange(null, "2024")).toBe("2024");
  });

  it("returns nothing when both are missing", () => {
    expect(formatDateRange(null, null)).toBe("");
  });
});
