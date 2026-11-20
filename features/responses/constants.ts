import type { ResponseKind } from "@/lib/responses/classify";

export const RESPONSES_PATH = "/dashboard/responses";

export const kindLabels: Record<ResponseKind, string> = {
  OFFER: "Offer",
  INTERVIEW: "Interview invitation",
  ASSESSMENT: "Assessment request",
  RECRUITER_SCREEN: "Recruiter call",
  REJECTION: "Rejection",
  INFO_REQUEST: "Request for information",
  ACKNOWLEDGEMENT: "Application received",
  OTHER: "Other message",
};

export const kindTones: Record<ResponseKind, "green" | "blue" | "yellow" | "red" | "neutral"> = {
  OFFER: "green",
  INTERVIEW: "green",
  ASSESSMENT: "blue",
  RECRUITER_SCREEN: "blue",
  REJECTION: "red",
  INFO_REQUEST: "yellow",
  ACKNOWLEDGEMENT: "neutral",
  OTHER: "neutral",
};
