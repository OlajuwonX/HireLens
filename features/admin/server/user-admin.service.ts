import type { UserRole } from "@/lib/db/schema";

export class AdminActionError extends Error {}

export function assertCanRevokeAdmin(input: {
  target: { role: UserRole };
  adminCount: number;
}): boolean {
  if (input.target.role !== "ADMIN") {
    return false;
  }

  if (input.adminCount <= 1) {
    throw new AdminActionError(
      "HireLens needs at least one admin — promote another user first.",
    );
  }

  return true;
}

export function assertCanDisable(input: {
  target: { id: string };
  actingAdminId: string;
}): void {
  if (input.target.id === input.actingAdminId) {
    throw new AdminActionError("You cannot disable your own account.");
  }
}
