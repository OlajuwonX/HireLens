import { describe, expect, it } from "vitest";
import { findAnswer, similarity } from "../src/execution/answer-match";
import { planFields } from "../src/execution/field-map";
import { RESUME_FILE } from "../src/execution/fields";
import { field, payload } from "./helpers";

const plan = (fields: ReturnType<typeof field>[], data = payload()) => planFields(fields, data);
const valueOf = (label: string, overrides = {}) => plan([field(label, overrides)]).fills[0]?.value;

describe("planFields", () => {
  it.each([
    ["First Name", "Ada"],
    ["Last Name", "Obi"],
    ["Email", "ada@example.com"],
    ["Phone", "+234 800 000 0000"],
    ["LinkedIn Profile", "https://linkedin.com/in/ada"],
    ["Website", "https://ada.dev"],
    ["Current location", "Lagos, Nigeria"],
    ["Will you now or in the future require visa sponsorship?", "No"],
    ["Are you willing to relocate?", "Yes"],
    ["What are your salary expectations?", "50000 USD"],
    ["Notice period", "4 weeks"],
    ["Years of experience", "4"],
  ])("fills %s from the profile", (label, value) => {
    expect(valueOf(label)).toBe(value);
  });

  it("attaches the resume to a resume upload, not to other files", () => {
    expect(valueOf("Resume/CV", { kind: "file" })).toBe(RESUME_FILE);
    expect(valueOf("Transcript", { kind: "file" })).toBeUndefined();
  });

  it("uses the cover letter only for a text area", () => {
    expect(valueOf("Cover Letter", { kind: "textarea" })).toBe("Dear Acme, I build React apps.");
    expect(valueOf("Cover Letter", { kind: "file" })).toBeUndefined();
  });

  it("answers work authorization only for a country the candidate listed", () => {
    expect(valueOf("Are you legally authorized to work in Nigeria?")).toBe("Yes");
    expect(valueOf("Are you legally authorized to work in the United States?")).toBeUndefined();
  });

  it("uses the answer bank for similar questions", () => {
    expect(valueOf("Why do you want to work at Acme?", { kind: "textarea" })).toBe("I want to build payments tools.");
  });

  it("never answers sensitive questions, even when required", () => {
    const result = plan([field("Gender", { kind: "select", required: true }), field("Veteran status", { required: true })]);

    expect(result.fills).toEqual([]);
    expect(result.missing).toEqual(["Gender", "Veteran status"]);
  });

  it("never ticks checkboxes such as consent", () => {
    const result = plan([field("I agree to the privacy policy", { kind: "checkbox", required: true })]);

    expect(result.fills).toEqual([]);
    expect(result.missing).toEqual(["I agree to the privacy policy"]);
  });

  it("lists required fields it cannot fill and skips optional ones", () => {
    const result = plan([
      field("GitHub", { required: true }),
      field("How did you hear about us?"),
    ]);

    expect(result.missing).toEqual(["GitHub"]);
    expect(result.fills).toEqual([]);
  });

  it("leaves sponsorship blank when the candidate never answered it", () => {
    const data = payload();
    data.candidate.requiresSponsorship = null;

    expect(plan([field("Do you require sponsorship?")], data).fills).toEqual([]);
  });
});

describe("answer matching", () => {
  it("ignores small words and punctuation", () => {
    expect(similarity("Why do you join Acme?", "why join acme")).toBe(1);
    expect(similarity("Why do you want to join Acme?", "why join acme")).toBe(0.75);
  });

  it("refuses weak matches", () => {
    expect(findAnswer("Describe a technical challenge", [{ question: "Why Acme?", answer: "x" }])).toBeNull();
  });
});
