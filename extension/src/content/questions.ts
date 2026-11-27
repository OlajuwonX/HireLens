import { isProfileOrSensitive } from "../../../local-worker/src/execution/field-map";
import type { FormField } from "../../../local-worker/src/execution/fields";
import type { Question } from "../shared/types";
import { maxLengthOf } from "./dom-fill";

const MAX_QUESTIONS = 20;
const LEGAL = /\b(signature|sign here|consent|i agree|acknowledg|certify|attest|terms|privacy|captcha)\b/i;
const OPEN_ENDED = /\?|\b(why|describe|tell us|explain|cover letter|motivat|interest|anything else|additional information)\b/i;
const CHOICE = new Set(["select", "radio"]);

function asksSomething(field: FormField) {
  if (field.kind === "file" || field.kind === "checkbox") return false;
  if (field.label.trim().length < 3 || LEGAL.test(field.label) || isProfileOrSensitive(field.label)) return false;
  if (CHOICE.has(field.kind)) return field.required && field.options.length > 0;

  return field.required || OPEN_ENDED.test(field.label);
}

export function openQuestions(fields: FormField[], asked: Set<string>): { questions: Question[]; fields: FormField[] } {
  const chosen = fields.filter((field) => !asked.has(field.selector) && asksSomething(field)).slice(0, MAX_QUESTIONS);

  return {
    fields: chosen,
    questions: chosen.map((field) => ({
      id: field.selector,
      label: field.label,
      kind: field.kind as Question["kind"],
      required: field.required,
      options: field.options,
      maxLength: CHOICE.has(field.kind) ? null : maxLengthOf(field),
    })),
  };
}
