import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { calculateChart } from "../lib/ephemeris.js";
import { extractKeyPlacements, generateRagQueries } from "../lib/placements.js";
import { generateReading } from "../lib/ai.js";

export const readingRouter = Router();

const ReadingRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Time must be HH:MM (00:00-23:59)"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  focus: z.enum(["general", "karmic", "mystic"]).default("general"),
});

interface RAGResult {
  text: string;
  source: string;
  score: number;
}

// Mock book excerpts for RAG
const MOCK_EXCERPTS: RAGResult[] = [
  { text: "The Sun represents the core essence of the individual — the conscious self, the life force, and the fundamental creative energy that radiates outward into the world. Its placement by sign and house reveals the primary mode of self-expression.", source: "Natal Charting (Filbey)", score: 0.95 },
  { text: "The Moon embodies the soul's emotional nature, instinctive responses, and the deeply personal inner world. It governs memory, the past, and unconscious patterns formed in childhood. The Moon's house position shows where we seek security and nurture.", source: "Natal Charting (Filbey)", score: 0.91 },
  { text: "The North Node of the Moon points toward the soul's intended direction of growth in this lifetime. The Lunar Nodes represent a pathway — a bridge between past-life mastery (South Node) and future soul evolution (North Node).", source: "Karmic Astrology (Wagner)", score: 0.88 },
  { text: "The Ascendant, or Rising Sign, is the mask we wear, the persona through which we interface with the world. It colors all other planetary expressions and represents our automatic, instinctive response to new situations.", source: "Natal Charting (Filbey)", score: 0.87 },
  { text: "The 4th, 8th, and 12th houses form what mystics call the Water Houses — portals to the invisible realms of ancestry, transformation, and cosmic unity. These houses hold the soul's deepest mysteries.", source: "Astrology for Mystics (McQuillar)", score: 0.93 },
  { text: "Water signs — Cancer, Scorpio, and Pisces — are the emotional, intuitive, and psychic channels of the zodiac. Planets in these signs bring heightened sensitivity to unseen realms and deep emotional intelligence.", source: "Astrology for Mystics (McQuillar)", score: 0.85 },
];

async function mockQueryVectorDB(query: string): Promise<RAGResult[]> {
  await new Promise((r) => setTimeout(r, 100));
  const lower = query.toLowerCase();
  const results: RAGResult[] = [];
  if (lower.includes("sun") || lower.includes("rising")) results.push(MOCK_EXCERPTS[0]);
  if (lower.includes("moon")) results.push(MOCK_EXCERPTS[1]);
  if (lower.includes("north node") || lower.includes("soul") || lower.includes("karma")) results.push(MOCK_EXCERPTS[2]);
  if (lower.includes("ascendant") || lower.includes("personality")) results.push(MOCK_EXCERPTS[3]);
  if (lower.includes("4") || lower.includes("8") || lower.includes("12")) results.push(MOCK_EXCERPTS[4]);
  if (lower.includes("water") || lower.includes("transformation")) results.push(MOCK_EXCERPTS[5]);
  if (results.length === 0) results.push(...MOCK_EXCERPTS.slice(0, 3));
  return results;
}

/**
 * POST /api/generate-reading
 * Calculate chart → extract placements → RAG → LLM synthesis
 */
readingRouter.post("/generate-reading", async (req: Request, res: Response) => {
  try {
    const parsed = ReadingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
    }

    const { date, time, latitude, longitude, focus } = parsed.data;
    const chart = calculateChart(date, time, latitude, longitude);
    const placements = extractKeyPlacements(chart);
    const queries = generateRagQueries(placements);

    const allExcerpts: RAGResult[] = [];
    for (const query of queries) {
      allExcerpts.push(...(await mockQueryVectorDB(query)));
    }

    const seen = new Set<string>();
    const unique = allExcerpts.filter((e) => {
      const k = e.text.slice(0, 80);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const reading = await generateReading(placements, unique);

    return res.json({
      success: true,
      data: {
        reading,
        placements: {
          sun: placements.sun, moon: placements.moon, ascendant: placements.ascendant,
          northNode: placements.northNode, southNode: placements.southNode,
          waterHousePlanets: placements.waterHousePlanets, stelliums: placements.stelliums,
        },
        excerpts: unique.map((e) => ({ source: e.source, snippet: e.text.slice(0, 200) + "...", score: e.score })),
      },
      meta: { date, time, latitude, longitude, focus, queriesUsed: queries, excerptCount: unique.length, calculatedAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Reading generation error:", error);
    return res.status(500).json({ error: "Failed to generate reading", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
