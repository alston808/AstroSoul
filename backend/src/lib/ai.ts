/**
 * AI Integration — LLM calls for reading synthesis.
 * Fallback chain: OpenAI → OpenRouter → Mock
 */

import type { KeyPlacements } from "./placements.js";

interface RAGResult {
  text: string;
  source: string;
  score: number;
}

const SYSTEM_PROMPT = `You are AstroSoul, an expert astrologer synthesizing insights from ancient wisdom texts and exact astronomical calculations. 

Your task: Generate a hyper-personalized astrological reading based STRICTLY on the provided book excerpts. Do not invent or hallucinate information beyond what the excerpts contain. 

Tone: Mystical, poetic, deeply personal. Address the user directly ("you", "your"). Weave the book excerpts together into a cohesive narrative about their soul's journey.

Structure your response in three sections:
1. ✦ **Your Natal Essence** — Synthesize Sun, Moon, and Ascendant excerpts
2. ✦ **Karmic Path** — Synthesize North Node/South Node excerpts
3. ✦ **Mystic Depths** — Synthesize Water House (4th, 8th, 12th) excerpts`;

interface LLMProvider {
  name: string;
  url: string;
  headers: (key: string) => Record<string, string>;
  model: string;
}

/**
 * Try multiple LLM providers in sequence, falling back to mock
 */
export async function generateReading(
  placements: KeyPlacements,
  ragResults: RAGResult[]
): Promise<string> {
  // Build the user prompt
  const excerpts = ragResults
    .map((r, i) => `[Excerpt ${i + 1} — Source: ${r.source}]\n${r.text}`)
    .join("\n\n");

  const userPrompt = `## User's Astrological Placements
${placements.summary.join("\n")}

## Relevant Book Excerpts
${excerpts}

Please synthesize a reading based on the above.`;

  // Providers in priority order
  const providers: LLMProvider[] = [
    {
      name: "OpenAI",
      url: "https://api.openai.com/v1/chat/completions",
      headers: (key: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${key}` }),
      model: "gpt-4o-mini",
    },
    {
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: (key: string) => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://astrosoul.app",
        "X-Title": "AstroSoul",
      }),
      model: "openai/gpt-4o-mini",
    },
  ];

  for (const provider of providers) {
    const envKey = provider.name === "OpenAI" ? "OPENAI_API_KEY" : "OPENROUTER_API_KEY";
    const apiKey = process.env[envKey];

    if (!apiKey || apiKey.includes("your-key-here")) {
      console.log(`  ⏭ ${provider.name}: no key configured`);
      continue;
    }

    try {
      console.log(`  🤖 Trying ${provider.name}...`);
      const response = await fetch(provider.url, {
        method: "POST",
        headers: provider.headers(apiKey),
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.log(`  ✗ ${provider.name}: HTTP ${response.status} — ${errText.slice(0, 100)}`);
        continue; // Try next provider
      }

      const data = await response.json() as { choices: { message: { content: string } }[] };
      console.log(`  ✓ ${provider.name} generated ${data.choices[0].message.content.length} chars`);
      return data.choices[0].message.content;
    } catch (error) {
      console.log(`  ✗ ${provider.name}: ${error}`);
    }
  }

  // All providers failed — use mock
  console.log("  ⚠ All LLM providers failed, using mock fallback");
  return generateMockReading(placements, ragResults);
}

/**
 * Mock reading generator (falls back when no API key)
 */
function generateMockReading(placements: KeyPlacements, ragResults: RAGResult[]): string {
  const { sun, moon, ascendant, northNode, southNode, waterHousePlanets, summary } = placements;
  const excerptCount = ragResults.length;

  return `## ✦ Your Natal Essence

With your Sun in **${sun.sign}** illuminating your ${sun.house}${ord(sun.house)} House and your Ascendant rising in **${ascendant.sign}**, you carry a unique blend of cosmic energies. Your Moon in **${moon.sign}** in the ${moon.house}${ord(moon.house)} House reveals your emotional landscape — where you seek security and how you nurture your soul.

${excerptCount > 0 ? `Based on the ${excerptCount} book excerpts retrieved from our knowledge base (currently in mock mode), your chart reveals a powerful combination of ${sun.sign}'s essence filtered through a ${ascendant.sign} persona.` : ""}

## ✦ Karmic Path

Your **North Node in ${northNode.sign}** calls you forward — this is your soul's evolutionary direction, the path you're meant to walk in this lifetime. Meanwhile, your **South Node in ${southNode.sign}** represents the comfort zone of past-life mastery that you must release to grow.

> "The North Node represents the soul's intended direction of growth — the qualities we must develop, however unfamiliar they feel." *(Lisa Wagner, Karmic Astrology — mock excerpt)*

## ✦ Mystic Depths

${waterHousePlanets.length > 0 ? `Your Water Houses (4th, 8th, and 12th) contain significant planetary activity: ${waterHousePlanets.map((p) => `**${p.planet} in ${p.sign}** in the ${p.house}${ord(p.house)}`).join(", ")}. These houses represent the soul's hidden chambers — ancestral memory (4th), transformation and rebirth (8th), and cosmic connection to the divine (12th).` : `Your Water Houses hold important clues to your soul's deeper journey into mysticism and transformation.`}

> "The 4th, 8th, and 12th houses are the water houses — the places where the veil between worlds is thinnest, where intuition and ancestral wisdom flow." *(Tayannah Lee McQuillar, Astrology for Mystics — mock excerpt)*

---

${summary.join(" | ")}

> ⚠ *Mock reading — LLM synthesis will be activated when OPENAI_API_KEY is configured. ${excerptCount} real excerpts were retrieved and will be used for the full synthesis.*`;
}

function ord(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}
