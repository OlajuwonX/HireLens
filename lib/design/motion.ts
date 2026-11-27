export const easing = {
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  inOut: "cubic-bezier(0.77, 0, 0.175, 1)",
  drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
} as const;

export const duration = {
  press: 140,
  fast: 160,
  menu: 200,
  panel: 280,
  reveal: 700,
} as const;

export const pressScale = 0.97;

export const spring = {
  settle: { type: "spring", bounce: 0, duration: 0.4 },
  sheet: { type: "spring", bounce: 0, duration: 0.3 },
  flick: { type: "spring", bounce: 0.2, duration: 0.4 },
} as const;
