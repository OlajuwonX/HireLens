export const ACCOUNT_STATES = [
  "ACTIVE",
  "DISABLED",
  "DELETION_PENDING",
] as const;

export type AccountState = (typeof ACCOUNT_STATES)[number];

export type BlockedAccountState = Exclude<AccountState, "ACTIVE">;

export type AccountLifecycle = {
  disabledAt: Date | null;
  deletedAt: Date | null;
};

export const BLOCKED_ACCOUNT_ROUTES: Record<BlockedAccountState, string> = {
  DISABLED: "/account/paused",
  DELETION_PENDING: "/account/scheduled",
};

export function resolveAccountState(account: AccountLifecycle): AccountState {
  if (account.deletedAt) {
    return "DELETION_PENDING";
  }

  if (account.disabledAt) {
    return "DISABLED";
  }

  return "ACTIVE";
}

export function isActiveAccount(account: AccountLifecycle) {
  return resolveAccountState(account) === "ACTIVE";
}

export function blockedAccountRoute(state: AccountState) {
  return state === "ACTIVE" ? null : BLOCKED_ACCOUNT_ROUTES[state];
}
