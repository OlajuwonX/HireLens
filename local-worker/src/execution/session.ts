import type { Fill, FormField } from "./fields";

export type Confirmation = { finalUrl?: string; confirmationText?: string };

export type FormSession = {
  hasCaptcha: () => Promise<boolean>;
  fields: () => Promise<FormField[]>;
  fill: (fill: Fill) => Promise<boolean>;
  read: (fill: Fill) => Promise<string>;
  submit: () => Promise<void>;
  waitForOutcome: (timeoutMs: number) => Promise<{ confirmation: Confirmation | null; submitAttempted: boolean }>;
  submitAttempted: () => boolean;
  close: () => Promise<void>;
};
