export const DELETION_GRACE_DAYS = 30;

export const PURGE_BATCH_SIZE = 20;

export const PURGE_WARNING_DAYS = 3;

export const DISABLE_CONFIRM_PHRASE = "PAUSE";

export const DELETE_CONFIRM_PHRASE = "DELETE";

export function purgeDateFrom(requestedAt: Date) {
  return new Date(
    requestedAt.getTime() + DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000,
  );
}

export function formatPurgeDate(value: Date) {
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
