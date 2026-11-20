export function feedVersion(rows: { publicId: string }[]) {
  let hash = 5381;

  for (const char of rows.map((row) => row.publicId).join("|")) {
    hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  }

  return `${rows.length}-${hash.toString(36)}`;
}
