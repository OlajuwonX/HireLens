export const RESPONSE_KINDS = [
  "OFFER",
  "INTERVIEW",
  "ASSESSMENT",
  "RECRUITER_SCREEN",
  "REJECTION",
  "INFO_REQUEST",
  "ACKNOWLEDGEMENT",
  "OTHER",
] as const;

export type ResponseKind = (typeof RESPONSE_KINDS)[number];

export const AUTO_CONFIDENCE = 70;

export const POSITIVE_KINDS: ResponseKind[] = ["OFFER", "INTERVIEW", "ASSESSMENT", "RECRUITER_SCREEN"];

const RULES: [ResponseKind, number, RegExp][] = [
  ["OFFER", 90, /\b(offer letter|pleased to (extend|offer)|extend (you )?an offer|job offer|offer of employment)\b/i],
  ["REJECTION", 90, /\b(regret to inform|not (be )?(moving|move) forward|decided (to|not to) (move|proceed)|pursue other candidates|position has (been|now been) filled|not (been )?selected|unable to offer you)\b/i],
  ["ASSESSMENT", 85, /\b((coding|technical|take[- ]home|online) (challenge|assessment|test|exercise|assignment)|hackerrank|codility|codesignal|testgorilla|coderpad)\b/i],
  ["INTERVIEW", 85, /\b(invite you to (an? )?(interview|meet)|schedule (an?|your|the) (interview|call|chat|conversation)|next (round|stage) (of|in) (the|our) (interview|process)|interview (invitation|request)|invitation to (an? )?interview|book (a|your) (time|slot)|calendly\.com|goodtime\.io)\b/i],
  ["RECRUITER_SCREEN", 75, /\b((phone|intro(ductory)?|initial) (screen|call|conversation)|quick (chat|call)|recruiter (call|screen))\b/i],
  ["ACKNOWLEDGEMENT", 85, /\b(thank(s| you) for (applying|your application|your interest)|(we('ve| have)|have) received your application|application (received|confirmation))\b/i],
  ["INFO_REQUEST", 75, /\b(could you (please )?(send|provide|share)|additional (information|details|documents)|please (complete|fill out|send us))\b/i],
  ["INTERVIEW", 55, /\binterview\b/i],
];

export function classifyEmail(input: { subject: string; text: string }) {
  const content = `${input.subject}\n${input.text}`;
  const match = RULES.find(([, , pattern]) => pattern.test(content));
  const [kind, confidence] = match ?? ["OTHER", 30];

  return { kind, confidence, needsReview: confidence < AUTO_CONFIDENCE };
}
