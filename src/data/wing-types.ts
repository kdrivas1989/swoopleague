// Canopy usage rules by class
// Sport = any canopy allowed
// Intermediate = limited set
// Advanced = Intermediate + Helix, Airwolf, Leia, Valkyrie
// Pro = all canopies allowed
const CANOPY_CLASS_RULES: Record<string, string[]> = {
  sport: [
    "Sabre 3/2",
    "Pilot",
    "Crossfire 2/3",
    "Katana",
    "Gangster",
    "JFX2",
    "JVX",
    "Comp Velo",
    "Helix",
    "Airwolf2",
    "Leia",
    "Valkyrie",
    "Wairwolf",
    "Sleia",
    "HKT",
    "HK",
    "Petra",
    "Sofia",
    "Peregrine",
  ],
  intermediate: [
    "Sabre 3/2",
    "Pilot",
    "Crossfire 2/3",
    "Katana",
    "Gangster",
    "JFX2",
    "JVX",
    "Comp Velo",
  ],
  advanced: [
    "Sabre 3/2",
    "Pilot",
    "Crossfire 2/3",
    "Katana",
    "Gangster",
    "JFX2",
    "JVX",
    "Comp Velo",
    "Helix",
    "Airwolf2",
    "Leia",
    "Valkyrie",
  ],
  pro: [
    "Sabre 3/2",
    "Pilot",
    "Crossfire 2/3",
    "Katana",
    "Gangster",
    "JFX2",
    "JVX",
    "Comp Velo",
    "Helix",
    "Airwolf2",
    "Leia",
    "Valkyrie",
    "Wairwolf",
    "Sleia",
    "HKT",
    "HK",
    "Petra",
    "Sofia",
    "Peregrine",
  ],
};

// All wing types (used when no class is selected)
export const WING_TYPES = [
  "Sabre 3/2",
  "Pilot",
  "Crossfire 2/3",
  "Katana",
  "Gangster",
  "JFX2",
  "JVX",
  "Comp Velo",
  "Helix",
  "Airwolf2",
  "Leia",
  "Valkyrie",
  "Wairwolf",
  "Sleia",
  "HKT",
  "HK",
  "Petra",
  "Sofia",
  "Peregrine",
  "Other",
] as const;

export function getWingTypesForClass(compClass: string): string[] {
  const allowed = CANOPY_CLASS_RULES[compClass];
  if (!allowed) return [...WING_TYPES];
  return [...allowed, "Other"];
}

export type WingType = (typeof WING_TYPES)[number];
