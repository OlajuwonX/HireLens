export function withoutSearchParams(href: string, keys: readonly string[]) {
  const url = new URL(href);

  for (const key of keys) {
    url.searchParams.delete(key);
  }

  return url.toString();
}

// One-time flags (saved=1, analysis=failed) would replay their toast on every
// reload or Back. Drop them from the address bar without a navigation.
export function clearUrlFlags(keys: readonly string[]) {
  const next = withoutSearchParams(window.location.href, keys);

  if (next !== window.location.href) {
    window.history.replaceState(window.history.state, "", next);
  }
}
