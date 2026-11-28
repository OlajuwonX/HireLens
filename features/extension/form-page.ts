const DESCRIPTION_SIGNALS = [
  /\bresponsibilit/i,
  /\brequirements?\b/i,
  /\bqualifications?\b/i,
  /\bwhat you('|’)ll do\b/i,
  /\bwhat we('|’)re looking for\b/i,
  /\babout the (role|job|team|position)\b/i,
  /\byou will\b/i,
  /\byears of (professional )?experience\b/i,
  /\bnice to have\b/i,
  /\bbenefits\b/i,
  /\bwho you are\b/i,
  /\bthe role\b/i,
];

const MIN_FORM_FIELDS = 3;

export function descriptionSignals(text: string) {
  return DESCRIPTION_SIGNALS.filter((pattern) => pattern.test(text)).length;
}

export function isFormOnly(text: string, fieldCount: number) {
  return fieldCount >= MIN_FORM_FIELDS && descriptionSignals(text) < 2;
}

export const FORM_ONLY_MESSAGE =
  "This page is the application form, not the job description. Open the job description, select Save description in HireLens, then come back and fill this page.";
