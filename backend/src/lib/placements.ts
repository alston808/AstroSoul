/**
 * Key placement extraction from chart data.
 * Identifies the most significant astrological placements for RAG retrieval.
 */

import type { ChartData, PlanetPosition, HouseCusp, Aspect } from "./ephemeris.js";

export interface KeyPlacements {
  sun: { sign: string; house: number; degree: number };
  moon: { sign: string; house: number; degree: number };
  ascendant: { sign: string; degree: number };
  northNode: { sign: string; house: number };
  southNode: { sign: string; house: number };
  waterHousePlanets: { planet: string; sign: string; house: number }[];
  stelliums: { sign: string; count: number; planets: string[] }[];
  dominantAspects: { type: string; planets: string }[];
  summary: string[];
}

/**
 * Get which house a planet occupies based on its longitude vs house cusps
 */
function getPlanetHouse(planetLon: number, houses: HouseCusp[]): number {
  for (let i = 0; i < 12; i++) {
    const cuspStart = houses[i].longitude;
    const cuspEnd = houses[(i + 1) % 12].longitude;

    if (cuspStart <= cuspEnd) {
      if (planetLon >= cuspStart && planetLon < cuspEnd) return i + 1;
    } else {
      // House wraps around 360°
      if (planetLon >= cuspStart || planetLon < cuspEnd) return i + 1;
    }
  }
  return 1; // fallback
}

/**
 * Extract key placements from a chart for AI reading context
 */
export function extractKeyPlacements(chart: ChartData): KeyPlacements {
  const houses = chart.houses;
  const planets = chart.planets;

  // Find specific planets (with fallbacks for safety)
  const sun = planets.find((p) => p.name === "Sun") ?? planets[0];
  const moon = planets.find((p) => p.name === "Moon") ?? planets[1];
  const northNode = planets.find((p) => p.name === "NorthNode") ?? planets[10];
  const southNode = planets.find((p) => p.name === "SouthNode") ??
    { name: "SouthNode", sign: "Aries", signIndex: 0, longitude: (northNode.longitude + 180) % 360, degree: 0, isRetrograde: false };

  const sunHouse = getPlanetHouse(sun.longitude, houses);
  const moonHouse = getPlanetHouse(moon.longitude, houses);
  const nnHouse = getPlanetHouse(northNode.longitude, houses);
  const snHouse = getPlanetHouse(southNode.longitude, houses);

  // Planets in Water Houses (4th, 8th, 12th)
  const waterHouses = [4, 8, 12];
  const waterHousePlanets = planets
    .filter((p) => {
      const house = getPlanetHouse(p.longitude, houses);
      return waterHouses.includes(house) && !["NorthNode", "SouthNode"].includes(p.name);
    })
    .map((p) => ({
      planet: p.name,
      sign: p.sign,
      house: getPlanetHouse(p.longitude, houses),
    }));

  // Stelliums (3+ planets in same sign)
  const signCounts = new Map<string, string[]>();
  for (const p of planets) {
    if (!signCounts.has(p.sign)) signCounts.set(p.sign, []);
    signCounts.get(p.sign)!.push(p.name);
  }
  const stelliums = [...signCounts.entries()]
    .filter(([, planets]) => planets.length >= 3)
    .map(([sign, planetList]) => ({ sign, count: planetList.length, planets: planetList }));

  // Dominant aspects
  const dominantAspects = chart.aspects
    .filter((a) => ["Conjunction", "Square", "Opposition"].includes(a.type))
    .slice(0, 5)
    .map((a) => ({ type: a.type, planets: `${a.planet1}-${a.planet2}` }));

  // Build human-readable summary
  const summary: string[] = [
    `Sun in ${sun.sign} (${sunHouse}${getOrdinal(sunHouse)} House)`,
    `Moon in ${moon.sign} (${moonHouse}${getOrdinal(moonHouse)} House)`,
    `Ascendant in ${chart.ascendant.sign}`,
    `North Node in ${northNode.sign} (${nnHouse}${getOrdinal(nnHouse)} House) — Soul's path forward`,
    `South Node in ${southNode.sign} (${snHouse}${getOrdinal(snHouse)} House) — Past life mastery`,
  ];

  if (waterHousePlanets.length > 0) {
    summary.push(
      `Water House planets: ${waterHousePlanets.map((p) => `${p.planet} in ${p.sign} (${p.house}H)`).join(", ")}`
    );
  }

  if (stelliums.length > 0) {
    summary.push(
      `Stelliums: ${stelliums.map((s) => `${s.sign} (${s.planets.join(", ")})`).join("; ")}`
    );
  }

  return {
    sun: { sign: sun.sign, house: sunHouse, degree: sun.degree },
    moon: { sign: moon.sign, house: moonHouse, degree: moon.degree },
    ascendant: { sign: chart.ascendant.sign, degree: chart.ascendant.degree },
    northNode: { sign: northNode.sign, house: nnHouse },
    southNode: { sign: southNode.sign, house: snHouse },
    waterHousePlanets,
    stelliums,
    dominantAspects,
    summary,
  };
}

function getOrdinal(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}

/**
 * Generate search queries for RAG retrieval based on placements
 */
export function generateRagQueries(placements: KeyPlacements): string[] {
  const queries: string[] = [];

  // Sun sign + house
  queries.push(`${placements.sun.sign} in ${placements.sun.house}${getOrdinal(placements.sun.house)} house`);

  // Moon sign + house
  queries.push(`${placements.moon.sign} Moon in ${placements.moon.house}${getOrdinal(placements.moon.house)} house`);

  // North Node karma
  queries.push(`North Node in ${placements.northNode.sign} soul path karma`);

  // Water house planets
  for (const wp of placements.waterHousePlanets) {
    queries.push(`${wp.planet} in ${wp.sign} ${wp.house}${getOrdinal(wp.house)} house transformation`);
  }

  // Ascendant
  queries.push(`${placements.ascendant.sign} rising ascendant personality`);

  return queries.slice(0, 5); // Limit to 5 queries
}
