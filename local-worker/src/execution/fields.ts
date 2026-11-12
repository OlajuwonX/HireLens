export type FieldKind = "text" | "textarea" | "select" | "radio" | "checkbox" | "file";

export type FormField = {
  selector: string;
  kind: FieldKind;
  label: string;
  required: boolean;
  options: string[];
};

export const RESUME_FILE = "__RESUME_FILE__";

export type Fill = {
  field: FormField;
  value: string;
  source: "profile" | "answer" | "cover-letter" | "resume" | "assistant";
};

export type FillPlan = { fills: Fill[]; missing: string[] };

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\*/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
