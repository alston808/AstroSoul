"use client";

import { useState } from "react";
import type { ChartWheelData } from "@/lib/chartRenderer";
import { PLANET_GLYPHS, PLANET_COLORS, ASPECT_COLORS, ASPECT_STYLES, getSignColor } from "@/lib/chartRenderer";

interface ChartDataPanelProps {
  data: ChartWheelData;
}

type Tab = "planets" | "houses" | "aspects";

export default function ChartDataPanel({ data }: ChartDataPanelProps) {
  const [tab, setTab] = useState<Tab>("planets");

  const tabs: { key: Tab; label: string }[] = [
    { key: "planets", label: "Planets" },
    { key: "houses", label: "Houses" },
    { key: "aspects", label: "Aspects" },
  ];

  return (
    <div className="glass-card overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-nebula-light/30">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-medium transition-all duration-200 ${
              tab === t.key
                ? "text-stellar border-b-2 border-stellar bg-stellar/5"
                : "text-lunar/40 hover:text-lunar/70"
            }`}
          >
            ✦ {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {tab === "planets" && <PlanetsTable data={data} />}
        {tab === "houses" && <HousesTable data={data} />}
        {tab === "aspects" && <AspectsTable data={data} />}
      </div>
    </div>
  );
}

function PlanetsTable({ data }: { data: ChartWheelData }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-lunar/40 uppercase tracking-wider border-b border-nebula-light/20">
          <th className="text-left py-2">Planet</th>
          <th className="text-right py-2">Degree</th>
          <th className="text-left py-2">Sign</th>
          <th className="text-right py-2">House</th>
          <th className="text-center py-2">R</th>
        </tr>
      </thead>
      <tbody>
        {data.planets.map((p) => (
          <tr
            key={p.name}
            className="border-b border-nebula-light/10 hover:bg-white/5 transition-colors"
          >
            <td className="py-2">
              <span
                className="inline-block w-5 text-center mr-1.5"
                style={{ color: PLANET_COLORS[p.name] ?? "#FFF" }}
              >
                {PLANET_GLYPHS[p.name] ?? "?"}
              </span>
              <span className="text-lunar/80">{p.name}</span>
            </td>
            <td className="text-right py-2 text-lunar/70 font-mono">
              {p.degree.toFixed(2)}°
            </td>
            <td className="py-2">
              <span
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  color: getSignColor(p.signIndex),
                  backgroundColor: getSignColor(p.signIndex) + "15",
                }}
              >
                {p.sign}
              </span>
            </td>
            <td className="text-right py-2 text-lunar/60 font-mono">
              {p.house ?? "-"}
            </td>
            <td className="text-center py-2">
              {p.isRetrograde ? (
                <span className="text-crimson font-bold" title="Retrograde">
                  ℞
                </span>
              ) : (
                <span className="text-lunar/20">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HousesTable({ data }: { data: ChartWheelData }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-lunar/40 uppercase tracking-wider border-b border-nebula-light/20">
          <th className="text-center py-2">House</th>
          <th className="text-right py-2">Degree</th>
          <th className="text-left py-2">Sign</th>
        </tr>
      </thead>
      <tbody>
        {data.houses.map((h) => (
          <tr
            key={h.house}
            className="border-b border-nebula-light/10 hover:bg-white/5 transition-colors"
          >
            <td className="text-center py-2 text-lunar/60 font-mono">
              {h.house}
              {h.house === 1 && " (ASC)"}
              {h.house === 10 && " (MC)"}
            </td>
            <td className="text-right py-2 text-lunar/70 font-mono">
              {h.degree.toFixed(2)}°
            </td>
            <td className="py-2">
              <span
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  color: getSignColor(h.signIndex),
                  backgroundColor: getSignColor(h.signIndex) + "15",
                }}
              >
                {h.sign}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AspectsTable({ data }: { data: ChartWheelData }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-lunar/40 uppercase tracking-wider border-b border-nebula-light/20">
          <th className="text-left py-2">Planets</th>
          <th className="text-center py-2">Aspect</th>
          <th className="text-right py-2">Orb</th>
        </tr>
      </thead>
      <tbody>
        {data.aspects.length === 0 ? (
          <tr>
            <td colSpan={3} className="text-center py-4 text-lunar/30">
              No major aspects found
            </td>
          </tr>
        ) : (
          data.aspects.map((a, i) => (
            <tr
              key={i}
              className="border-b border-nebula-light/10 hover:bg-white/5 transition-colors"
            >
              <td className="py-2 text-lunar/80">
                <span style={{ color: PLANET_COLORS[a.planet1] }}>
                  {PLANET_GLYPHS[a.planet1]}
                </span>{" "}
                {a.planet1}
                <span className="text-lunar/30 mx-1">·</span>
                <span style={{ color: PLANET_COLORS[a.planet2] }}>
                  {PLANET_GLYPHS[a.planet2]}
                </span>{" "}
                {a.planet2}
              </td>
              <td className="text-center py-2">
                <span
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    color: ASPECT_COLORS[a.type] ?? "#FFF",
                    backgroundColor:
                      (ASPECT_COLORS[a.type] ?? "#FFF") + "15",
                  }}
                >
                  {a.type}
                </span>
              </td>
              <td className="text-right py-2 text-lunar/50 font-mono">
                {a.orb.toFixed(2)}°
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
