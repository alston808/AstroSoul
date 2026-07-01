"use client";

import SymbolBackground from "@/components/SymbolBackground";
import NatalChartWheel from "@/components/NatalChartWheel";
import ChartDataPanel from "@/components/ChartDataPanel";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ChartWheelData } from "@/lib/chartRenderer";

interface SaveStatus {
  state: "idle" | "saving" | "saved" | "error";
  chartId?: string;
  message?: string;
}

export default function NatalChartPage() {
  const { isAuthenticated, user, init } = useAuthStore();
  const [chartData, setChartData] = useState<any>(null);
  const [wheelData, setWheelData] = useState<ChartWheelData | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "idle" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    async function loadChart() {
      setLoading(true);

      // 1. Try loading from Supabase if authenticated
      if (isAuthenticated && user) {
        try {
          const supabase = getSupabaseClient();
          const { data: charts } = await supabase
            .from("birth_charts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (charts && charts.length > 0) {
            const chart = charts[0];
            // Load full chart data from related tables
            const [{ data: planets }, { data: houses }, { data: aspects }] =
              await Promise.all([
                supabase
                  .from("birth_chart_planets")
                  .select("*")
                  .eq("chart_id", chart.id),
                supabase
                  .from("birth_chart_houses")
                  .select("*")
                  .eq("chart_id", chart.id),
                supabase
                  .from("birth_chart_aspects")
                  .select("*")
                  .eq("chart_id", chart.id),
              ]);

            if (planets && houses) {
              const wd: ChartWheelData = {
                planets: planets.map((p: any) => ({
                  name: p.planet_name,
                  degree: p.degree,
                  sign: p.sign,
                  signIndex: p.sign_index,
                  longitude: p.longitude,
                  isRetrograde: p.is_retrograde,
                  house: p.house,
                })),
                houses: houses.map((h: any) => ({
                  house: h.house_number,
                  degree: h.degree,
                  sign: h.sign,
                  signIndex: h.sign_index,
                  longitude: h.longitude,
                })),
                ascendant: houses
                  ? {
                      house: 1,
                      degree: houses[0]?.degree ?? 0,
                      sign: houses[0]?.sign ?? "Aries",
                      signIndex: houses[0]?.sign_index ?? 0,
                      longitude: houses[0]?.longitude ?? 0,
                    }
                  : {
                      house: 1,
                      degree: chart.ascendant_degree ?? 0,
                      sign: chart.ascendant_sign ?? "Aries",
                      signIndex: 0,
                      longitude: 0,
                    },
                midheaven: houses
                  ? {
                      house: 10,
                      degree: houses[9]?.degree ?? 0,
                      sign: houses[9]?.sign ?? "Aries",
                      signIndex: houses[9]?.sign_index ?? 0,
                      longitude: houses[9]?.longitude ?? 0,
                    }
                  : {
                      house: 10,
                      degree: chart.midheaven_degree ?? 0,
                      sign: chart.midheaven_sign ?? "Aries",
                      signIndex: 0,
                      longitude: 0,
                    },
                aspects: (aspects || []).map((a: any) => ({
                  planet1: a.planet1,
                  planet2: a.planet2,
                  type: a.aspect_type,
                  angle: a.angle,
                  orb: a.orb,
                })),
              };
              setWheelData(wd);
              setChartData(chart);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load from Supabase:", err);
        }
      }

      // 2. Fall back to sessionStorage
      const raw = sessionStorage.getItem("astroData");
      if (raw) {
        const parsed = JSON.parse(raw);
        setChartData(parsed);

        // Build wheel data from session data
        if (parsed.success && parsed.data) {
          setWheelData(parsed.data as ChartWheelData);
        }
      }

      setLoading(false);
    }

    loadChart();
  }, [isAuthenticated, user]);

  const handleSaveToSupabase = async () => {
    if (!isAuthenticated || !user || !wheelData) return;
    setSaveStatus({ state: "saving" });

    try {
      const supabase = getSupabaseClient();

      // Insert chart
      const { data: chart, error: chartErr } = await supabase
        .from("birth_charts")
        .insert({
          user_id: user.id,
          name: null,
          birth_date: chartData?.meta?.date ?? new Date().toISOString().split("T")[0],
          birth_time: chartData?.meta?.time ?? "12:00",
          latitude: chartData?.meta?.latitude ?? 0,
          longitude: chartData?.meta?.longitude ?? 0,
          timezone: "0",
          ascendant_sign: wheelData.ascendant.sign,
          ascendant_degree: wheelData.ascendant.degree,
          midheaven_sign: wheelData.midheaven.sign,
          midheaven_degree: wheelData.midheaven.degree,
        })
        .select()
        .single();

      if (chartErr || !chart) throw chartErr ?? new Error("Failed to save chart");

      // Insert planets
      await supabase.from("birth_chart_planets").insert(
        wheelData.planets.map((p) => ({
          chart_id: chart.id,
          planet_name: p.name,
          sign: p.sign,
          sign_index: p.signIndex,
          degree: p.degree,
          longitude: p.longitude,
          house: p.house ?? null,
          is_retrograde: p.isRetrograde,
        }))
      );

      // Insert houses
      await supabase.from("birth_chart_houses").insert(
        wheelData.houses.map((h) => ({
          chart_id: chart.id,
          house_number: h.house,
          sign: h.sign,
          sign_index: h.signIndex,
          degree: h.degree,
          longitude: h.longitude,
        }))
      );

      // Insert aspects
      if (wheelData.aspects.length > 0) {
        await supabase.from("birth_chart_aspects").insert(
          wheelData.aspects.map((a) => ({
            chart_id: chart.id,
            planet1: a.planet1,
            planet2: a.planet2,
            aspect_type: a.type,
            angle: a.angle,
            orb: a.orb,
          }))
        );
      }

      setSaveStatus({ state: "saved", chartId: chart.id });
    } catch (err) {
      console.error("Failed to save chart:", err);
      setSaveStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Failed to save",
      });
    }
  };

  return (
    <SymbolBackground symbol="galaxy-bg" opacity={0.3}>
      <div className="min-h-screen p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-display neon-text-gold">✦ Natal Chart</h1>
          <div className="flex gap-3">
            <Link
              href="/"
              className="glass-card px-4 py-2 text-sm text-lunar/60 hover:text-lunar transition-colors"
            >
              ← New Chart
            </Link>
            {isAuthenticated && wheelData && (
              <button
                onClick={handleSaveToSupabase}
                disabled={saveStatus.state === "saving" || saveStatus.state === "saved"}
                className={`glass-card px-4 py-2 text-sm transition-all duration-300 ${
                  saveStatus.state === "saved"
                    ? "text-emerald border-emerald/30"
                    : saveStatus.state === "error"
                    ? "text-crimson"
                    : "text-electric hover:shadow-neon-cyan"
                }`}
              >
                {saveStatus.state === "saving"
                  ? "Saving..."
                  : saveStatus.state === "saved"
                  ? "✓ Saved"
                  : saveStatus.state === "error"
                  ? "✗ Error"
                  : "💾 Save to My Charts"}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-16 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-violet border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lunar/60">Loading chart data...</p>
          </div>
        ) : wheelData ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart Wheel */}
            <div className="lg:col-span-2 flex justify-center">
              <div className="w-full max-w-[600px]">
                <NatalChartWheel data={wheelData} />
              </div>
            </div>

            {/* Data Panel */}
            <div className="space-y-4">
              <ChartDataPanel data={wheelData} />

              {/* Quick Actions */}
              <div className="glass-card p-4 space-y-2">
                <h3 className="text-sm font-display text-stellar mb-2">
                  ✦ Explore
                </h3>
                <Link
                  href="/dashboard/karmic-path"
                  className="block px-3 py-2 rounded-lg bg-void/50 border border-nebula-light/20 text-sm text-stellar hover:shadow-neon-gold transition-all duration-200"
                >
                  Karmic Path →
                </Link>
                <Link
                  href="/dashboard/mystic-depths"
                  className="block px-3 py-2 rounded-lg bg-void/50 border border-nebula-light/20 text-sm text-violet hover:shadow-neon-purple transition-all duration-200"
                >
                  Mystic Depths →
                </Link>
              </div>

              {/* Auth prompt */}
              {!isAuthenticated && (
                <div className="glass-card p-4 text-center">
                  <p className="text-lunar/60 text-sm mb-3">
                    Sign in to save your chart and unlock all readings.
                  </p>
                  <Link
                    href={`/auth?redirect=/dashboard/natal-chart`}
                    className="inline-block px-4 py-2 rounded-lg bg-violet/20 border border-violet/40 text-violet text-sm hover:shadow-neon-purple transition-all"
                  >
                    Sign In / Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-lunar/60 mb-4">
              No chart data yet. Enter your birth details to calculate your natal
              chart.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg bg-violet/20 border border-violet/40 text-violet hover:shadow-neon-purple transition-all"
            >
              ✦ Calculate Your Chart
            </Link>
          </div>
        )}
      </div>
    </SymbolBackground>
  );
}
