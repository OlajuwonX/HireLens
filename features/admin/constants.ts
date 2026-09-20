export const OPS_CONSOLE_PATH = "/ops-console";
export const ADMIN_ROOT_PATH = "/admin";

export const ADMIN_ACTIONS = {
  PROMOTE_ADMIN: "PROMOTE_ADMIN",
  REVOKE_ADMIN: "REVOKE_ADMIN",
  DISABLE_USER: "DISABLE_USER",
  ENABLE_USER: "ENABLE_USER",
  UPDATE_BUG_STATUS: "UPDATE_BUG_STATUS",
  IMPERSONATE_START: "IMPERSONATE_START",
  IMPERSONATE_END: "IMPERSONATE_END",
} as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[keyof typeof ADMIN_ACTIONS];

export const adminActionLabels: Record<AdminAction, string> = {
  PROMOTE_ADMIN: "Promoted to admin",
  REVOKE_ADMIN: "Revoked admin",
  DISABLE_USER: "Disabled account",
  ENABLE_USER: "Re-enabled account",
  UPDATE_BUG_STATUS: "Updated bug report status",
  IMPERSONATE_START: "Started impersonating",
  IMPERSONATE_END: "Stopped impersonating",
};

export const ADMIN_TARGET_TYPES = {
  USER: "user",
  BUG_REPORT: "bug_report",
} as const;

export type AdminTargetType =
  (typeof ADMIN_TARGET_TYPES)[keyof typeof ADMIN_TARGET_TYPES];

export const IMPERSONATION_TTL_MS = 15 * 60 * 1000;
