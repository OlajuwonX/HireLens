export const fontFamily = {
  sans: "var(--font-brand-sans)",
  mono: "var(--font-brand-mono)",
} as const;

export type TypeStyle = {
  size: string;
  weight: number;
  lineHeight: string;
  family: keyof typeof fontFamily;
  tracking?: string;
};

export type TypeScaleName =
  | "display"
  | "pageTitle"
  | "sectionTitle"
  | "cardMetric"
  | "body"
  | "secondary"
  | "label"
  | "systemLabel";

export const typeScale: Record<TypeScaleName, TypeStyle> = {
  display: {
    size: "clamp(2rem, 1.4rem + 2.6vw, 3.5rem)",
    weight: 600,
    lineHeight: "1.04",
    family: "sans",
    tracking: "-0.03em",
  },
  pageTitle: {
    size: "clamp(1.5rem, 1.3rem + 0.8vw, 2rem)",
    weight: 600,
    lineHeight: "1.15",
    family: "sans",
    tracking: "-0.02em",
  },
  sectionTitle: {
    size: "1.25rem",
    weight: 600,
    lineHeight: "1.3",
    family: "sans",
    tracking: "-0.01em",
  },
  cardMetric: {
    size: "clamp(1.75rem, 1.5rem + 1vw, 2.25rem)",
    weight: 600,
    lineHeight: "1.05",
    family: "sans",
    tracking: "-0.025em",
  },
  body: {
    size: "1rem",
    weight: 400,
    lineHeight: "1.55",
    family: "sans",
  },
  secondary: {
    size: "0.875rem",
    weight: 400,
    lineHeight: "1.55",
    family: "sans",
  },
  label: {
    size: "0.8125rem",
    weight: 500,
    lineHeight: "1.4",
    family: "sans",
  },
  systemLabel: {
    size: "0.75rem",
    weight: 500,
    lineHeight: "1.3",
    family: "mono",
    tracking: "0.06em",
  },
};

export const typeClass: Record<TypeScaleName, string> = {
  display: "font-sans text-display font-semibold",
  pageTitle: "font-sans text-page-title font-semibold",
  sectionTitle: "font-sans text-section-title font-semibold",
  cardMetric: "font-sans text-card-metric font-semibold",
  body: "font-sans text-body",
  secondary: "font-sans text-meta",
  label: "font-sans text-label font-medium",
  systemLabel: "font-mono text-system font-medium",
};
