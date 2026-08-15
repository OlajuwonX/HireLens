export function shiftOffset(
  current: number | null,
  delta: number,
): number | null {
  if (current === null) {
    return null;
  }

  return Math.max(0, current + delta);
}
