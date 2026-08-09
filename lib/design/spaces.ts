export const space = {
  "0": "0px",
  "2xs": "0.125rem",
  xs: "0.25rem",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  "3xl": "1.5rem",
  "4xl": "2rem",
  "5xl": "2.5rem",
  "6xl": "3rem",
  "7xl": "4rem",
  "8xl": "5rem",
} as const;

export type SpaceToken = keyof typeof space;

export const spacing = {
  controlPaddingInline: space["2xl"],
  controlGap: space.md,
  fieldGap: space.md,
  relatedGap: space.lg,
  cardPadding: space["2xl"],
  cardGap: space.xl,
  sectionGap: space["4xl"],
  pageGap: space["5xl"],
  landingSectionGap: space["7xl"],
} as const;
