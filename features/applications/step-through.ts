export function neighbourId(ids: string[], current: string | null, direction: 1 | -1) {
  const index = current ? ids.indexOf(current) : -1;

  if (index === -1) {
    return null;
  }

  return ids[index + direction] ?? null;
}

export function directionFor(key: string): 1 | -1 | null {
  if (key === "ArrowDown" || key === "ArrowRight" || key === "j") return 1;
  if (key === "ArrowUp" || key === "ArrowLeft" || key === "k") return -1;

  return null;
}

export function isTypingTarget(target: EventTarget | null) {
  if (!target || typeof (target as HTMLElement).closest !== "function") {
    return false;
  }

  const element = target as HTMLElement;

  return element.isContentEditable || Boolean(element.closest("input, textarea, select, [role='tablist'], [contenteditable='true']"));
}

export function openHref(query: string, publicId: string) {
  return `/dashboard/jobs?${query ? `${query}&` : ""}open=${publicId}`;
}

export function hasOpenOverlay(root: Pick<Document, "querySelector"> = document) {
  return Boolean(root.querySelector("[role='dialog'][data-state='open'], [role='alertdialog'][data-state='open'], [role='menu'][data-state='open'], [role='listbox']"));
}
