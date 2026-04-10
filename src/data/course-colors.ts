export const COURSE_COLORS = [
  { value: "silver", label: "Silver", subtitle: "Essentials of Canopy Flight", hex: "#C0C0C0" },
  { value: "yellow", label: "Yellow", subtitle: "Intermediate Canopy Flight", hex: "#FFD700" },
  { value: "orange", label: "Orange", subtitle: "Advanced Canopy Flight", hex: "#FF8C00" },
  { value: "green", label: "Green", subtitle: "Advanced Targeting", hex: "#32CD32" },
  { value: "grey", label: "Grey", subtitle: "Relative Canopy Flight", hex: "#808080" },
  { value: "blue", label: "Blue", subtitle: "Intro to Swooping", hex: "#4169E1" },
  { value: "red", label: "Red", subtitle: "Advanced Swooping", hex: "#DC143C" },
  { value: "black", label: "Black", subtitle: "Elite Canopy Flight", hex: "#1a1a1a" },
  { value: "pink", label: "Pink", subtitle: "CP Chicks!", hex: "#FF69B4" },
] as const;

export type CourseColor = (typeof COURSE_COLORS)[number]["value"];

export function getCourseColorHex(color: string | null): string {
  const found = COURSE_COLORS.find((c) => c.value === color);
  return found?.hex ?? "#00d4ff";
}

export function getCourseColorLabel(color: string | null): string {
  const found = COURSE_COLORS.find((c) => c.value === color);
  return found ? `${found.label} — ${found.subtitle}` : "";
}
