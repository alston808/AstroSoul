"use client";

import AuthGuard from "@/components/AuthGuard";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ChartRecord } from "@/lib/stores/useAuthStore";

export default function MyChartsPage() {
  return (
    <AuthGuard>
      <MyChartsContent />
    </AuthGuard>
  );
}

function MyChartsContent() {
  const { charts, user, init } = useAuthStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const handleDelete = async (chartId: string) => {
    if (!confirm("Delete this chart? This cannot be undone.")) return;
    setDeleting(chartId);
    try {
      const supabase = getSupabaseClient();
      await supabase.from("birth_charts").delete().eq("id", chartId);
      // Refresh chart list
      await useAuthStore.getState().loadCharts();
    } catch (err) {
      console.error("Failed to delete chart:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 galaxy-bg">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display neon-text-gold">✦ My Charts</h1>
          <Link
            href="/"
            className="glass-card px-4 py-2 text-sm text-electric hover:shadow-neon-cyan transition-all"
          >
            + New Chart
          </Link>
        </div>

        {charts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-lunar/60 mb-4">
              No charts saved yet. Calculate your natal chart to get started.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg bg-violet/20 border border-violet/40 text-violet hover:shadow-neon-purple transition-all"
            >
              ✦ Calculate Your First Chart
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {charts.map((chart: ChartRecord) => (
              <div
                key={chart.id}
                className="glass-card p-4 flex items-center justify-between hover:border-violet/30 transition-all duration-200"
              >
                <div className="flex-1">
                  <p className="text-lunar font-medium">
                    {chart.ascendant_sign
                      ? `${chart.ascendant_sign} Rising`
                      : "Natal Chart"}
                  </p>
                  <p className="text-xs text-lunar/40 mt-1">
                    {chart.birth_date} ·{" "}
                    {new Date(chart.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/natal-chart?chartId=${chart.id}`}
                    className="text-xs text-electric hover:text-electric/80 transition-colors px-3 py-1 rounded border border-electric/20 hover:border-electric/40"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(chart.id)}
                    disabled={deleting === chart.id}
                    className="text-xs text-crimson/50 hover:text-crimson transition-colors px-3 py-1 rounded border border-crimson/10 hover:border-crimson/30 disabled:opacity-30"
                  >
                    {deleting === chart.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <nav className="mt-8 flex gap-4 flex-wrap justify-center">
          <Link
            href="/dashboard/natal-chart"
            className="glass-card px-4 py-2 text-sm text-electric hover:shadow-neon-cyan transition-all"
          >
            ← Natal Chart
          </Link>
          <Link
            href="/"
            className="glass-card px-4 py-2 text-sm text-lunar/60 hover:text-lunar transition-all"
          >
            Home
          </Link>
        </nav>
      </div>
    </main>
  );
}
