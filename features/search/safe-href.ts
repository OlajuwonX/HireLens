const MAX_HREF_LENGTH = 300;
const DELETE_CODE = 0x7f;
const SPACE_CODE = 0x20;

function hasUnsafeCharacter(href: string) {
  for (const character of href) {
    const code = character.charCodeAt(0);

    if (code <= SPACE_CODE || code === DELETE_CODE || /\s/.test(character)) {
      return true;
    }
  }

  return false;
}

export function isSafeInternalHref(href: unknown): href is string {
  if (typeof href !== "string") {
    return false;
  }

  if (href.length === 0 || href.length > MAX_HREF_LENGTH) {
    return false;
  }

  if (!href.startsWith("/") || href.startsWith("//")) {
    return false;
  }

  if (href.includes("\\")) {
    return false;
  }

  return !hasUnsafeCharacter(href);
}
