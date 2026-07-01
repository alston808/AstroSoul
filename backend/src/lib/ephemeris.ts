/**
 * Swiss Ephemeris wrapper for astrological calculations.
 * Uses @swisseph/node v1.x for exact planetary positions.
 */

import {
  dateToJulianDay,
  calculatePosition,
  calculateHouses,
  Planet,
  Asteroid,
  LunarPoint,
  HouseSystem,
} from "@swisseph/node";

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export interface PlanetPosition {
  name: string;
  degree: number;
  sign: string;
  signIndex: number;
  longitude: number;
  isRetrograde: boolean;
}

export interface HouseCusp {
  house: number;
  degree: number;
  sign: string;
  signIndex: number;
  longitude: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
}

export interface ChartData {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  ascendant: HouseCusp;
  midheaven: HouseCusp;
  aspects: Aspect[];
}

/**
 * Convert longitude to zodiac sign and degree
 */
function longitudeToSign(lon: number): { sign: string; signIndex: number; degree: number } {
  const signIndex = Math.floor(lon / 30) % 12;
  return {
    sign: ZODIAC_SIGNS[signIndex],
    signIndex,
    degree: lon % 30,
  };
}

/**
 * Calculate aspect between two planets
 */
function getAspect(angle: number): { type: string; orb: number } | null {
  const aspects = [
    { type: "Conjunction", base: 0, orb: 8 },
    { type: "Sextile", base: 60, orb: 6 },
    { type: "Square", base: 90, orb: 8 },
    { type: "Trine", base: 120, orb: 8 },
    { type: "Opposition", base: 180, orb: 8 },
    { type: "Quincunx", base: 150, orb: 5 },
  ];

  for (const aspect of aspects) {
    const diff = Math.abs(angle - aspect.base);
    const minDiff = Math.min(diff, 360 - diff);
    if (minDiff <= aspect.orb) {
      return { type: aspect.type, orb: Math.round(minDiff * 100) / 100 };
    }
  }
  return null;
}

/**
 * Calculate a full natal chart
 */
type CelestialBody = Planet | Asteroid | LunarPoint;

const PLANET_LIST: { name: string; body: CelestialBody }[] = [
  { name: "Sun", body: Planet.Sun }, { name: "Moon", body: Planet.Moon },
  { name: "Mercury", body: Planet.Mercury }, { name: "Venus", body: Planet.Venus },
  { name: "Mars", body: Planet.Mars }, { name: "Jupiter", body: Planet.Jupiter },
  { name: "Saturn", body: Planet.Saturn }, { name: "Uranus", body: Planet.Uranus },
  { name: "Neptune", body: Planet.Neptune }, { name: "Pluto", body: Planet.Pluto },
  { name: "NorthNode", body: LunarPoint.MeanNode }, { name: "Chiron", body: Asteroid.Chiron },
];

export function calculateChart(
  date: string,
  time: string,
  lat: number,
  lng: number
): ChartData {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, h, min));
  const jd = dateToJulianDay(dt);

  // Planets
  const planets: PlanetPosition[] = PLANET_LIST.map(({ name, body }) => {
    const pos = calculatePosition(jd, body);
    const s = longitudeToSign(pos.longitude);
    return { name, degree: Math.round(s.degree * 100) / 100, sign: s.sign, signIndex: s.signIndex, longitude: pos.longitude, isRetrograde: pos.longitudeSpeed < 0 };
  });

  // Houses
  const houses = calculateHouses(jd, lat, lng, HouseSystem.Placidus);
  const houseCusps: HouseCusp[] = [];
  for (let i = 1; i <= 12; i++) {
    const s = longitudeToSign(houses.cusps[i]);
    houseCusps.push({ house: i, degree: Math.round(s.degree * 100) / 100, sign: s.sign, signIndex: s.signIndex, longitude: houses.cusps[i] });
  }

  const asc = longitudeToSign(houses.ascendant);
  const mc = longitudeToSign(houses.mc);

  // Aspects
  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++)
    for (let j = i + 1; j < planets.length; j++) {
      const angle = Math.min(Math.abs(planets[i].longitude - planets[j].longitude), 360 - Math.abs(planets[i].longitude - planets[j].longitude));
      const a = getAspect(angle);
      if (a) aspects.push({ planet1: planets[i].name, planet2: planets[j].name, type: a.type, angle: Math.round(angle * 100) / 100, orb: a.orb });
    }

  return {
    planets, houses: houseCusps,
    ascendant: { house: 1, degree: Math.round(asc.degree * 100) / 100, sign: asc.sign, signIndex: asc.signIndex, longitude: houses.ascendant },
    midheaven: { house: 10, degree: Math.round(mc.degree * 100) / 100, sign: mc.sign, signIndex: mc.signIndex, longitude: houses.mc },
    aspects,
  };
}
