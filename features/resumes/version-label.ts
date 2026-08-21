export const MAX_VERSION_LABEL_LENGTH = 120;

export function resumeVersionLabelFromFilename(filename: string) {
  const base = filename.replace(/\.pdf$/i, "").trim();

  return (base || "Resume").slice(0, MAX_VERSION_LABEL_LENGTH);
}

export function withVersionSuffix(label: string, versionNumber: number) {
  const suffix = ` v${versionNumber}`;
  const base = label.slice(0, MAX_VERSION_LABEL_LENGTH - suffix.length);

  return `${base.trimEnd()}${suffix}`;
}
