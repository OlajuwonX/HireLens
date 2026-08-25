export const usageDenialReasons = [
  "ACTIVE_REQUEST",
  "BURST_LIMIT",
  "DAILY_LIMIT",
  "GLOBAL_LIMIT",
] as const;

export type UsageDenialReason = (typeof usageDenialReasons)[number];

const messages: Record<UsageDenialReason, string> = {
  ACTIVE_REQUEST:
    "Another AI request is already running. Wait for it to finish, then try again.",
  BURST_LIMIT:
    "You have reached the short-term AI request limit. Try again in about a minute.",
  DAILY_LIMIT:
    "You have used today's AI allowance for this action. It resets at midnight UTC.",
  GLOBAL_LIMIT:
    "HireLens has used its shared daily AI budget. Try again tomorrow.",
};

export function isUsageDenialReason(
  value: unknown,
): value is UsageDenialReason {
  return usageDenialReasons.includes(value as UsageDenialReason);
}

export function usageLimitMessage(reason: UsageDenialReason) {
  return messages[reason];
}

export function readUsageDenialReason(value: unknown) {
  return isUsageDenialReason(value) ? value : null;
}
