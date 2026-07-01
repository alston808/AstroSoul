import * as fs from "fs";
import * as path from "path";

const OUT = path.join(__dirname, "..", "frontend", "public", "images", "symbols");
const API = "https://image.pollinations.ai/prompt";
const PARAMS = "?width=1024&height=1024&nologo=true&model=flux";

const PROMPTS: Record<string, string> = {
  sun: "luminous golden sun corona flares, dark galaxy nebula, neon gold glow, ethereal",
  moon: "silver crescent moon liquid mercury surface crater glow, dark galaxy, neon silver-blue luminescence",
  mercury: "winged caduceus staff electric blue neon, quicksilver fluidity, dark space, cyan glow",
  venus: "rose-gold celestial mirror pearl luminescence, divine feminine, dark nebula, pink gold glow",
  mars: "crimson war shield plasma arcs, warrior spirit, dark space, red neon blaze",
  jupiter: "amber lightning bolt expanding golden rings, sage wisdom, dark galaxy, amber glow",
  saturn: "obsidian scythe dark amber ring restraints, lord of karma, dark space, onyx amber glow",
  uranus: "electric blue lightning shattering crystal, awakening, dark nebula, electric blue burst",
  neptune: "deep violet trident dissolving misty ocean, mystical veil, dark space, violet haze",
  pluto: "obsidian phoenix rising volcanic ember underglow, underworld, dark galaxy, magenta black fire",
  "north-node": "golden dragon head upward spiral staircase stars, soul destiny, dark space, gold ascension",
  "south-node": "silver dragon tail descending roots ancient earth, past life, dark nebula, silver descent",
  chiron: "broken key mending itself teal healing light, wounded healer, dark space, mint teal glow",
  lilith: "inverted black crescent moon shadow serpent, dark feminine, dark galaxy, dark magenta black glow",
  ascendant: "horizon line golden dawn light cracking darkness, rising sun, dark space, gold horizon",
  aries: "majestic ram curved horns wreathed wildfire forge sparks, warrior, dark space, crimson fire",
  taurus: "powerful bull emerald garden granite monolith, abundance, dark nebula, emerald green",
  gemini: "twin silhouettes mirror winged sandals, duality, dark space, cyan twin energy",
  cancer: "crab moonlit tide pool glowing pearl shell, nurturing, dark galaxy, silver lunar glow",
  leo: "regal lion flowing mane solar disc throne stars, royal, dark space, gold radiance",
  virgo: "sheaf wheat crystalline lattice ancient scroll, precision, dark nebula, mint green",
  libra: "golden scales justice floating dove feather, harmony, dark space, rose gold pink",
  scorpio: "scorpion transforming phoenix deep water vortex, alchemy, dark galaxy, magenta",
  sagittarius: "centaur archer arrow flight distant galaxy, seeker truth, dark space, amber fire",
  capricorn: "sea-goat climbing obsidian mountain peak hourglass, ambition, dark nebula, dark onyx",
  aquarius: "water bearer pouring stars circuit board constellation, visionary, dark space, electric blue",
  pisces: "two fish swimming cosmic nebula veil between worlds, dark galaxy, violet mist",
  "house-1": "neon mirror reflecting dawn horizon theatrical mask, identity, dark space, crimson dawn",
  "house-2": "ancient treasure vault roots gold coins earth, security, dark nebula, emerald glow",
  "house-3": "neon quill writing winged scrolls constellation pathways, dark space, cyan script",
  "house-4": "moonlit roots underground ancestral tree hearth fire, soul home, dark galaxy, silver lunar",
  "house-5": "spotlit stage heartburst constellation golden chalice, joy, dark space, gold glow",
  "house-6": "glowing crystalline body labyrinth wheat clock gears, service, dark nebula, mint healing",
  "house-7": "two hands reaching mirrored reflections wedding band nebula, union, dark space, rose gold",
  "house-8": "phoenix rising obsidian chrysalis dark water alchemical crucible, dark galaxy, magenta",
  "house-9": "spiral galaxy road mountaintop beacon compass rose, wisdom, dark space, amber cosmic road",
  "house-10": "midnight throne zenith point crown constellation, legacy, dark nebula, onyx gold",
  "house-11": "constellation network electric bees star-web, collective, dark space, electric blue network",
  "house-12": "deep ocean abyss dissolving veil cosmic whale dream realm, dark galaxy, violet abyss",
  conjunction: "two neon circles merging single unified golden glow, fusion, dark space, gold merging",
  sextile: "six-pointed star gentle arc bridging luminous planets, opportunity, dark nebula, emerald arc",
  square: "fractured diamond tension lines neon prison bars, challenge, dark space, crimson tension",
  trine: "perfect luminous triangle flowing river starlight, harmony, dark galaxy, electric blue harmony",
  opposition: "cosmic teeter-totter axis two worlds pulling apart twilight, polarity, dark space, magenta polarity",
  quincunx: "zigzag bridge misaligned gears trying mesh, awkward adjustment, dark nebula, violet",
  fire: "spiral flame phoenix wing magma veins, elemental fire, dark space, crimson fire spiral",
  earth: "glowing root system crystalline cave gemstones, elemental earth, dark galaxy, emerald earth",
  air: "single feather silver wind storm cloud lightning, elemental air, dark space, cyan wind",
  water: "bioluminescent deep ocean wave moon-tide tears stars, elemental water, dark nebula, violet ocean",
  ether: "nebula spiral cosmic web, fifth element pure spirit, dark space, gold violet spirit",
  butterfly: "neon-winged butterfly emerging dark chrysalis, metamorphosis, dark galaxy, magenta violet wings",
  anchor: "glowing silver anchor sinking cosmic sea chain dissolving stardust, grounding, dark space, silver",
  phoenix: "magnificent firebird rising obsidian ash wings flame, rebirth, dark nebula, magenta crimson fire",
  ouroboros: "serpent eating own tail infinity loop neon gold, eternal cycle, dark space, gold serpent",
  lotus: "lotus blooming black cosmic water petals violet-pink, enlightenment, dark galaxy, rose violet lotus",
  key: "ornate skeleton key unlocking constellation door deep space, destiny, dark space, gold key starlight",
  labyrinth: "neon maze spiraling inward central glowing star, life journey, dark nebula, violet neon",
  "thread-of-fate": "three silver threads weaving tapestry dark space, the Moirai, dark galaxy, silver",
  "tree-of-life": "cosmic tree roots galaxy branches constellations, growth, dark space, emerald gold",
  hourglass: "glass hourglass falling star-sand onyx frame, Saturn time, dark galaxy, dark onyx gold sand",
  eclipse: "black sun corona lunar shadow passing, cosmic destiny, dark space, gold corona",
  "vesica-piscis": "sacred geometry vesica piscis portal between worlds, divine, dark nebula, violet geometry",
  seed: "glowing golden seed cracking open void potential energy, beginnings, dark space, gold seed",
  compass: "floating celestial compass needle pointing North Star galaxy, direction, dark nebula, amber compass",
  "galaxy-bg": "deep space galaxy purple indigo nebula scattered neon stars, vast void",
  starfield: "subtle twinkling starfield pattern tiny luminous dots void, minimal, silver stars",
  "neon-ring": "perfect circular neon ring glowing dark space, chart border frame, violet ring",
  "constellation-lines": "thin luminous constellation lines connecting bright stars geometric web, cyan",
  "zenith-glyph": "glowing glyph zenith point vertical beam light, midheaven pinnacle, gold",
  "nadir-glyph": "inverted glowing glyph nadir point roots descending, foundation, silver",
  divider: "horizontal neon line embedded planetary glyphs, cosmic divider, violet line",
};

const ALL = Object.keys(PROMPTS);

async function main() {
  console.log("AstroSoul Image Generator v3 - Pollinations.ai");
  console.log("Symbols: " + ALL.length);
  console.log("");
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0, fail = 0;
  const failed: string[] = [];
  for (const id of ALL) {
    const outPath = path.join(OUT, id + ".webp");
    if (fs.existsSync(outPath)) { ok++; console.log("skip " + id + " (exists)"); continue; }
    try {
      const prompt = PROMPTS[id];
      const url = API + "/" + encodeURIComponent(prompt) + PARAMS;
      console.log(id + ": " + prompt.slice(0, 50) + "...");
      const res = await fetch(url);
      if (!res.ok) { console.log("  HTTP " + res.status); fail++; failed.push(id); continue; }
      const jpeg = Buffer.from(await res.arrayBuffer());
      console.log("  downloaded " + (jpeg.length / 1024).toFixed(1) + "KB JPEG");
      const sharp = await import("sharp");
      const webp = await sharp.default(jpeg).webp({ quality: 80 }).resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).toBuffer();
      fs.writeFileSync(outPath, webp);
      console.log("  saved " + id + ".webp (" + (webp.length / 1024).toFixed(1) + "KB)");
      ok++;
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.log("  error: " + e);
      fail++; failed.push(id);
    }
  }
  console.log("\nDone: " + ok + " ok, " + fail + " failed");
  if (failed.length) {
    fs.writeFileSync(path.join(__dirname, "failed.json"), JSON.stringify(failed, null, 2));
    console.log("Failed IDs saved to failed.json");
  }
}

main().catch(console.error);
