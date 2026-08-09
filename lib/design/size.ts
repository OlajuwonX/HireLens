export const radius = {
  none: "0px",
  control: "2px",
  icon: "3px",
  card: "6px",
  panel: "6px",
  full: "9999px",
} as const;

export const controlHeight = {
  primary: "2.75rem",
  default: "2.5rem",
  compact: "2rem",
  icon: "2.25rem",
} as const;

export const controlHeightClass = {
  primary: "h-11",
  default: "h-10",
  compact: "h-8",
  icon: "h-9",
} as const;

export const sidebarWidthClass = {
  expanded: "w-60",
  collapsed: "w-18",
} as const;

export const iconSize = {
  sm: "1rem",
  md: "1.125rem",
  lg: "1.25rem",
} as const;

export const sidebarWidth = {
  expanded: "15rem",
  collapsed: "4.5rem",
  drawer: "min(88vw, 20rem)",
} as const;

export const containerWidth = {
  page: "80rem",
  reading: "45rem",
  form: "26rem",
} as const;

export const breakpoint = {
  xs: "320px",
  sm: "375px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

export const minTouchTarget = "2.75rem";

export type RadiusToken = keyof typeof radius;
export type ControlHeightToken = keyof typeof controlHeight;
