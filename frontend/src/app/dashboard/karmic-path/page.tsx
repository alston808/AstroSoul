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

export default function KarmicPathPage() {
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
          // Load saved karmic readings
          const { data: readings } = await supabase
            .from("saved_readings")
            .select("*")
            .eq("user_id", user.id)
            .eq("focus", "karmic")
            .order("created_at", { ascending: false })
            .limit(1);

          if (readings && readings.length > 0) {
            setReading(readings[0] as unknown as ReadingData);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Failed to load karmic reading:", err);
        }
      }

      // Fallback: check sessionStorage for chart data to generate reading
      const raw = sessionStorage.getItem("astroData");
      if (raw) {
        setChartData(JSON.parse(raw));
      }

      setLoading(false);
    }

    load();
  }, [isAuthenticated, user]);

  const generateKarmicReading = async () => {
    if (!chartData?.meta) return;
    setGenerating(true);

    try {
      const res = await fetch("http://localhost:3001/api/generate-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...chartData.meta,
          focus: "karmic",
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

        // Save to Supabase if authenticated
        if (isAuthenticated && user) {
          const supabase = getSupabaseClient();
          await supabase.from("saved_readings").insert({
            user_id: user.id,
            focus: "karmic",
            reading_text: result.data.reading,
            excerpts_json: result.data.excerpts,
            placements_json: result.data.placements,
          });
        }
      }
    } catch (err) {
      console.error("Failed to generate karmic reading:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SymbolBackground symbol="north-node" opacity={0.12}>
      <div className="min-h-screen p-4 md:p-8">
        <h1 className="text-4xl font-display neon-text-gold mb-6">✦ Karmic Path</h1>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-violet border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lunar/60">Loading your karmic reading...</p>
          </div>
        ) : reading ? (
          <div className="glass-card p-6 space-y-6">
            {/* Placements summary */}
            {reading.placements_json && (
              <div className="flex flex-wrap gap-2 mb-4">
                {reading.placements_json.northNode && (
                  <span className="px-3 py-1 rounded-full bg-stellar/10 border border-stellar/20 text-stellar text-xs">
                    ☊ North Node in{" "}
                    {reading.placements_json.northNode.sign}{" "}
                    ({reading.placements_json.northNode.house}H)
                  </span>
                )}
                {reading.placements_json.southNode && (
                  <span className="px-3 py-1 rounded-full bg-lunar/10 border border-lunar/20 text-lunar text-xs">
                    ☋ South Node in{" "}
                    {reading.placements_json.southNode.sign}{" "}
                    ({reading.placements_json.southNode.house}H)
                  </span>
                )}
              </div>
            )}

            {/* Rendering markdown-like reading */}
            <div
              className="prose prose-invert max-w-none text-lunar/90 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: reading.reading_text
                  .replace(/^###?\s+(.+)$/gm, '<h3 class="text-stellar font-display text-lg mt-6 mb-2">$1</h3>')
                  .replace(/^##\s+(.+)$/gm, '<h2 class="text-stellar font-display text-xl mt-8 mb-3">$1</h2>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-stellar">$1</strong>')
                  .replace(/^>\s*(.+)$/gm, '<blockquote class="border-l-2 border-violet/40 pl-4 italic text-lunar/60">$1</blockquote>')
                  .replace(/^\*\s+(.+)$/gm, '<li class="ml-4 text-lunar/70">$1</li>')
                  .replace(/\n/g, '<br/>'),
              }}
            />

            {/* Book excerpts used */}
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
                      <p className="text-lunar/30 mt-1">
                        — {ex.source}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <p className="text-xs text-lunar/30">
              Generated{" "}
              {new Date(reading.created_at).toLocaleDateString()}
            </p>
          </div>
        ) : chartData ? (
          <div className="glass-card p-8 text-center space-y-4">
            <p className="text-lunar">
              Your chart is ready. Generate your Karmic Path reading to discover
              your soul&apos;s evolutionary direction.
            </p>
            <button
              onClick={generateKarmicReading}
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-stellar/10 border border-stellar/30 text-stellar hover:shadow-neon-gold transition-all disabled:opacity-50"
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
                "✦ Reveal Karmic Path"
              )}
            </button>
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-lunar mb-4">
              Calculate your natal chart first to unlock your Karmic Path
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

        {/* Navigation */}
        <nav className="mt-8 flex gap-4 flex-wrap justify-center">
          <Link
            href="/dashboard/natal-chart"
            className="glass-card px-4 py-2 text-sm text-electric hover:shadow-neon-cyan transition-all"
          >
            ← Natal Chart
          </Link>
          <Link
            href="/dashboard/mystic-depths"
            className="glass-card px-4 py-2 text-sm text-violet hover:shadow-neon-purple transition-all"
          >
            Mystic Depths →
          </Link>
        </nav>
      </div>
    </SymbolBackground>
  );
}
