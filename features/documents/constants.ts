export const DOCUMENT_TYPES = [
  "COVER_LETTER",
  "APPLICATION_EMAIL",
  "EMAIL_SUBJECT",
  "LINKEDIN_MESSAGE",
  "FOLLOW_UP_EMAIL",
  "THANK_YOU_EMAIL",
  "PROFESSIONAL_INTRO",
  "CAREER_CHANGE_EXPLANATION",
  "ENTRY_LEVEL_NOTE",
] as const;

export const documentTypeLabels: Record<(typeof DOCUMENT_TYPES)[number], string> = {
  COVER_LETTER: "Cover letter",
  APPLICATION_EMAIL: "Application email",
  EMAIL_SUBJECT: "Email subject",
  LINKEDIN_MESSAGE: "LinkedIn message",
  FOLLOW_UP_EMAIL: "Follow-up email",
  THANK_YOU_EMAIL: "Thank-you email",
  PROFESSIONAL_INTRO: "Professional intro",
  CAREER_CHANGE_EXPLANATION: "Career-change note",
  ENTRY_LEVEL_NOTE: "Entry-level note",
};
