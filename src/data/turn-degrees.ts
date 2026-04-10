export const TURN_DEGREES = [
  "Straight In",
  "90",
  "270",
  "450",
  "630",
  "810",
  "990",
  "More...",
] as const;

export type TurnDegree = (typeof TURN_DEGREES)[number];
