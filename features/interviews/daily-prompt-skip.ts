function skipKey(cyclePublicId: string, dayIndex: number) {
  return `hl:interview-daily-skip:${cyclePublicId}:${dayIndex}`;
}

export function isDailyPromptSkipped(
  cyclePublicId: string,
  dayIndex: number,
): boolean {
  try {
    return (
      window.localStorage.getItem(skipKey(cyclePublicId, dayIndex)) === "1"
    );
  } catch {
    return false;
  }
}

export function skipDailyPromptToday(
  cyclePublicId: string,
  dayIndex: number,
): void {
  try {
    window.localStorage.setItem(skipKey(cyclePublicId, dayIndex), "1");
  } catch {
    return;
  }
}
