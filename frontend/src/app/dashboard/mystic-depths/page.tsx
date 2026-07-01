"use client";

import SymbolBackground from "@/components/SymbolBackground";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ReadingData {
  id: string;
  reading_text: string;
  placements_json: any;
  excerpts_json: any[];
  created_at: string;
}

export default function MysticDepthsPage() {
  const { isAuthenticated, user, init } = useAuthStore();
  const [reading, setReading] = useState<ReadingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);

      if (isAuthenticated && user) {
        try {
          const supabase = getSupabaseClient();
          const { data: readings } = await supabase
            .from("saved_readings")
            .select("*")
            .eq("user_id", user.id)
            .eq("focus", "mystic")
            .order("created_at", { ascending: false })
            .limit(1);

          if (readings && readings.length > 0) {
            setReading(readings[0] as unknown as ReadingData);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Failed to load mystic reading:", err);
        }
      }

      const raw = sessionStorage.getItem("astroData");
      if (raw) setChartData(JSON.parse(raw));

      setLoading(false);
    }

    load();
  }, [isAuthenticated, user]);

  const generateMysticReading = async () => {
    if (!chartData?.meta) return;
    setGenerating(true);

    try {
      const res = await fetch("http://localhost:3001/api/generate-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...chartData.meta,
          focus: "mystic",
        }),
      });

      if (!res.ok) throw new Error("Failed to generate reading");

      const result = await res.json();

      if (result.success) {
        const newReading: ReadingData = {
          id: "temp",
          reading_text: result.data.reading,
          placements_json: result.data.placements,
          excerpts_json: result.data.excerpts,
          created_at: new Date().toISOString(),
        };
        setReading(newReading);

        if (isAuthenticated && user) {
          const supabase = getSupabaseClient();
          await supabase.from("saved_readings").insert({
            user_id: user.id,
            focus: "mystic",
            reading_text: result.data.reading,
            excerpts_json: result.data.excerpts,
            placements_json: result.data.placements,
          });
        }
      }
    } catch (err) {
      console.error("Failed to generate mystic reading:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SymbolBackground symbol="neptune" opacity={0.12}>
      <div className="min-h-screen p-4 md:p-8">
        <h1 className="text-4xl font-display neon-text-purple mb-6">
          ✦ Mystic Depths
        </h1>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-violet border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lunar/60">Loading your mystic reading...</p>
          </div>
        ) : reading ? (
          <div className="glass-card p-6 space-y-6">
            {reading.placements_json?.waterHousePlanets?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {reading.placements_json.waterHousePlanets.map(
                  (wp: any, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-xs"
                    >
                      {wp.planet} in {wp.sign} ({wp.house}H)
                    </span>
                  )
                )}
              </div>
            )}

            <div
              className="prose prose-invert max-w-none text-lunar/90 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: reading.reading_text
                  .replace(
                    /^###?\s+(.+)$/gm,
                    '<h3 class="text-violet font-display text-lg mt-6 mb-2">$1</h3>'
                  )
                  .replace(
                    /^##\s+(.+)$/gm,
                    '<h2 class="text-violet font-display text-xl mt-8 mb-3">$1</h2>'
                  )
                  .replace(
                    /\*\*(.+?)\*\*/g,
                    '<strong class="text-violet">$1</strong>'
                  )
                  .replace(
                    /^>\s*(.+)$/gm,
                    '<blockquote class="border-l-2 border-violet/40 pl-4 italic text-lunar/60">$1</blockquote>'
                  )
                  .replace(/\n/g, "<br/>"),
              }}
            />

            {reading.excerpts_json && reading.excerpts_json.length > 0 && (
              <details className="mt-4">
                <summary className="text-xs text-lunar/40 cursor-pointer hover:text-lunar/60">
                  📚 {reading.excerpts_json.length} book excerpt
                  {reading.excerpts_json.length !== 1 ? "s" : ""} used
                </summary>
                <div className="mt-2 space-y-2">
                  {reading.excerpts_json.map((ex: any, i: number) => (
                    <div
                      key={i}
                      className="bg-void/50 border border-nebula-light/20 rounded-lg p-2 text-xs"
                    >
                      <p className="text-lunar/50 italic">
                        {ex.snippet ?? ex.text?.slice(0, 200)}
                      </p>
                      <p className="text-lunar/30 mt-1">— {ex.source}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <p className="text-xs text-lunar/30">
              Generated {new Date(reading.created_at).toLocaleDateString()}
            </p>
          </div>
        ) : chartData ? (
          <div className="glass-card p-8 text-center space-y-4">
            <p className="text-lunar">
              Discover the hidden depths of your Water Houses — the 4th, 8th,
              and 12th houses of soul memory, transformation, and cosmic
              connection.
            </p>
            <button
              onClick={generateMysticReading}
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-violet/10 border border-violet/30 text-violet hover:shadow-neon-purple transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                "✦ Reveal Mystic Depths"
              )}
            </button>
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-lunar mb-4">
              Calculate your natal chart first to unlock your Mystic Depths
              reading.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg bg-violet/20 border border-violet/40 text-violet hover:shadow-neon-purple transition-all"
            >
              ✦ Calculate Your Chart
            </Link>
          </div>
        )}

        <nav className="mt-8 flex gap-4 flex-wrap justify-center">
          <Link
            href="/dashboard/karmic-path"
            className="glass-card px-4 py-2 text-sm text-stellar hover:shadow-neon-gold transition-all"
          >
            ← Karmic Path
          </Link>
          <Link
            href="/dashboard/natal-chart"
            className="glass-card px-4 py-2 text-sm text-electric hover:shadow-neon-cyan transition-all"
          >
            Natal Chart →
          </Link>
        </nav>
      </div>
    </SymbolBackground>
  );
}
