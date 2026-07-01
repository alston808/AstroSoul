/**
 * Chart Renderer Helpers
 * D3.js utilities for rendering the natal chart wheel.
 */

/** Zodiac signs in order with their glyph symbols */
export const ZODIAC = [
  { name: "Aries", glyph: "♈", color: "#FF2D2D" },
  { name: "Taurus", glyph: "♉", color: "#00FF88" },
  { name: "Gemini", glyph: "♊", color: "#00E5FF" },
  { name: "Cancer", glyph: "♋", color: "#C0C0FF" },
  { name: "Leo", glyph: "♌", color: "#FFD700" },
  { name: "Virgo", glyph: "♍", color: "#98FF98" },
  { name: "Libra", glyph: "♎", color: "#FF69B4" },
  { name: "Scorpio", glyph: "♏", color: "#FF00FF" },
  { name: "Sagittarius", glyph: "♐", color: "#FFB347" },
  { name: "Capricorn", glyph: "♑", color: "#808080" },
  { name: "Aquarius", glyph: "♒", color: "#00BFFF" },
  { name: "Pisces", glyph: "♓", color: "#8B00FF" },
] as const;

/** Planet glyphs */
export const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  NorthNode: "☊", Chiron: "⚷",
};

/** Planet neon colors */
export const PLANET_COLORS: Record<string, string> = {
  Sun: "#FFD700", Moon: "#C0C0FF", Mercury: "#00E5FF", Venus: "#FF69B4",
  Mars: "#FF2D2D", Jupiter: "#FFB347", Saturn: "#808080", Uranus: "#00BFFF",
  Neptune: "#8B00FF", Pluto: "#FF00FF", NorthNode: "#FFD700", Chiron: "#00FF88",
};

/** Aspect colors */
export const ASPECT_COLORS: Record<string, string> = {
  Conjunction: "#FFD700",
  Sextile: "#00BFFF",
  Square: "#FF2D2D",
  Trine: "#00FF88",
  Opposition: "#FF00FF",
  Quincunx: "#FFB347",
};

/** Aspect stroke styles */
export const ASPECT_STYLES: Record<string, { dash: string; width: number }> = {
  Conjunction: { dash: "none", width: 2 },
  Sextile: { dash: "6,3", width: 1.5 },
  Square: { dash: "none", width: 2 },
  Trine: { dash: "none", width: 1.5 },
  Opposition: { dash: "4,4", width: 2 },
  Quincunx: { dash: "2,4", width: 1 },
};

export interface ChartPlanet {
  name: string;
  degree: number;
  sign: string;
  signIndex: number;
  longitude: number;
  isRetrograde: boolean;
  house?: number;
}

export interface ChartHouse {
  house: number;
  degree: number;
  sign: string;
  signIndex: number;
  longitude: number;
}

export interface ChartAspect {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
}

export interface ChartWheelData {
  planets: ChartPlanet[];
  houses: ChartHouse[];
  ascendant: ChartHouse;
  midheaven: ChartHouse;
  aspects: ChartAspect[];
}

/**
 * Convert a zodiac longitude (0-360) to radians for the chart wheel.
 * The Ascendant is pinned at the 9 o'clock position (left side).
 * Zodiac signs run counterclockwise from Aries (0° = 3 o'clock in standard orientation,
 * but we rotate so Ascendant is at 9 o'clock).
 */
export function longitudeToRadians(
  longitude: number,
  ascendantLongitude: number
): number {
  // In the chart wheel, we want the Ascendant at π (left / 9 o'clock).
  // Standard: 0° Aries is at the left (9 o'clock = π radians)
  // Going counterclockwise.
  // So: position = π - (longitude * π / 180) + (ascendant * π / 180)
  // Simplified: we rotate so ascendant is at π
  let rad = ((longitude - ascendantLongitude) * Math.PI) / 180;
  // Flip to make counterclockwise
  rad = -rad + Math.PI;
  // Normalize to 0-2π
  while (rad < 0) rad += 2 * Math.PI;
  while (rad >= 2 * Math.PI) rad -= 2 * Math.PI;
  return rad;
}

/**
 * Get the sign glyph for a given sign index
 */
export function getSignGlyph(index: number): string {
  return ZODIAC[index]?.glyph ?? "?";
}

/**
 * Get the sign color for a given sign index
 */
export function getSignColor(index: number): string {
  return ZODIAC[index]?.color ?? "#FFF";
}

/**
 * Calculate rendering positions for all planets on the wheel
 */
export function getPlanetPositions(
  planets: ChartPlanet[],
  ascendantLongitude: number,
  radius: number
) {
  return planets.map((p) => {
    const angle = longitudeToRadians(p.longitude, ascendantLongitude);
    return {
      ...p,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      angle,
    };
  });
}

/**
 * Calculate house cusp positions for rendering
 */
export function getHousePositions(
  houses: ChartHouse[],
  ascendantLongitude: number,
  radius: number
) {
  return houses.map((h) => {
    const angle = longitudeToRadians(h.longitude, ascendantLongitude);
    return {
      ...h,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      angle,
    };
  });
}
