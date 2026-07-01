"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { ChartWheelData, ChartPlanet } from "@/lib/chartRenderer";
import {
  ZODIAC,
  PLANET_GLYPHS,
  PLANET_COLORS,
  ASPECT_COLORS,
  ASPECT_STYLES,
  longitudeToRadians,
} from "@/lib/chartRenderer";

interface NatalChartWheelProps {
  data: ChartWheelData;
  width?: number;
  height?: number;
}

interface TooltipData {
  planet: string;
  sign: string;
  degree: number;
  house: number | string;
  isRetrograde: boolean;
  x: number;
  y: number;
}

export default function NatalChartWheel({
  data,
  width = 600,
  height = 600,
}: NatalChartWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [activePlanet, setActivePlanet] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = 40;
    const innerW = width - margin * 2;
    const innerH = height - margin * 2;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(innerW, innerH) / 2;
    const ascLon = data.ascendant.longitude;

    const g = svg
      .append("g")
      .attr("transform", `translate(${centerX},${centerY})`);

    // ================================================================
    // OUTER RING — Zodiac signs (12 segments)
    // ================================================================
    const signArc = d3
      .arc<{ startAngle: number; endAngle: number; sign: string; glyph: string; color: string }>()
      .innerRadius(outerRadius - 60)
      .outerRadius(outerRadius)
      .cornerRadius(2);

    const signData = ZODIAC.map((z, i) => {
      // Each sign spans 30 degrees, starting from the Ascendant position
      const startAngle =
        longitudeToRadians(i * 30, ascLon) - (Math.PI / 180) * 15;
      const endAngle = startAngle + (Math.PI / 180) * 30;
      return { startAngle, endAngle, sign: z.name, glyph: z.glyph, color: z.color };
    });

    g.selectAll(".sign-segment")
      .data(signData)
      .enter()
      .append("path")
      .attr("class", "sign-segment")
      .attr("d", (d) => signArc(d) as string)
      .attr("fill", (d) => d.color + "15")
      .attr("stroke", (d) => d.color + "40")
      .attr("stroke-width", 0.5);

    // Sign glyphs
    g.selectAll(".sign-glyph")
      .data(signData)
      .enter()
      .append("text")
      .attr("class", "sign-glyph")
      .attr("x", (d) => {
        const midAngle = (d.startAngle + d.endAngle) / 2;
        return Math.cos(midAngle) * (outerRadius - 30);
      })
      .attr("y", (d) => {
        const midAngle = (d.startAngle + d.endAngle) / 2;
        return Math.sin(midAngle) * (outerRadius - 30);
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "20px")
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.8)
      .text((d) => d.glyph);

    // ================================================================
    // MIDDLE RING — House cusps (thin lines)
    // ================================================================
    const houseRadius = outerRadius - 65;

    g.selectAll(".house-line")
      .data(data.houses)
      .enter()
      .append("line")
      .attr("class", "house-line")
      .attr("x1", (h) => {
        const a = longitudeToRadians(h.longitude, ascLon);
        return Math.cos(a) * houseRadius;
      })
      .attr("y1", (h) => {
        const a = longitudeToRadians(h.longitude, ascLon);
        return Math.sin(a) * houseRadius;
      })
      .attr("x2", (h) => {
        const a = longitudeToRadians(h.longitude, ascLon);
        return Math.cos(a) * (outerRadius + 5);
      })
      .attr("y2", (h) => {
        const a = longitudeToRadians(h.longitude, ascLon);
        return Math.sin(a) * (outerRadius + 5);
      })
      .attr("stroke", "rgba(255, 255, 255, 0.15)")
      .attr("stroke-width", 1);

    // House numbers
    g.selectAll(".house-label")
      .data(data.houses)
      .enter()
      .append("text")
      .attr("class", "house-label")
      .attr("x", (h) => {
        const a = longitudeToRadians(h.longitude, ascLon);
        const nextA = longitudeToRadians(
          data.houses[h.house % 12].longitude,
          ascLon
        );
        let midA = (a + nextA) / 2;
        if (Math.abs(nextA - a) > Math.PI) midA += Math.PI;
        return Math.cos(midA) * (outerRadius - 15);
      })
      .attr("y", (h) => {
        const a = longitudeToRadians(h.longitude, ascLon);
        const nextA = longitudeToRadians(
          data.houses[h.house % 12].longitude,
          ascLon
        );
        let midA = (a + nextA) / 2;
        if (Math.abs(nextA - a) > Math.PI) midA += Math.PI;
        return Math.sin(midA) * (outerRadius - 15);
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "9px")
      .attr("fill", "rgba(255,255,255,0.3)")
      .text((h) => h.house);

    // ================================================================
    // INNER RING — Aspect lines
    // ================================================================
    const planetPositions = new Map<string, { x: number; y: number }>();
    const planetRadius = outerRadius - 110;

    data.planets.forEach((p) => {
      const a = longitudeToRadians(p.longitude, ascLon);
      planetPositions.set(p.name, {
        x: Math.cos(a) * planetRadius,
        y: Math.sin(a) * planetRadius,
      });
    });

    // Draw aspect lines (only show around chart perimeter, not through center)
    data.aspects.forEach((aspect) => {
      const p1 = planetPositions.get(aspect.planet1);
      const p2 = planetPositions.get(aspect.planet2);
      if (!p1 || !p2) return;

      const style = ASPECT_STYLES[aspect.type] ?? { dash: "none", width: 1 };
      const color = ASPECT_COLORS[aspect.type] ?? "rgba(255,255,255,0.3)";

      // Calculate midpoint on the arc (not straight line)
      g.append("path")
        .attr("class", "aspect-line")
        .attr("d", () => {
          const a1 = Math.atan2(p1.y, p1.x);
          const a2 = Math.atan2(p2.y, p2.x);
          return d3.arc()({
            innerRadius: planetRadius,
            outerRadius: planetRadius,
            startAngle: a1,
            endAngle: a2,
            padAngle: 0,
          }) as string;
        })
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", style.width)
        .attr("stroke-opacity", (activePlanet && activePlanet !== aspect.planet1 && activePlanet !== aspect.planet2) ? 0.15 : 0.6)
        .attr("stroke-dasharray", style.dash === "none" ? undefined : style.dash)
        .attr("pointer-events", "none");
    });

    // ================================================================
    // CENTER — Planet glyphs and points
    // ================================================================
    const planetGroup = g.append("g").attr("class", "planets");

    planetGroup
      .selectAll(".planet-dot")
      .data(data.planets)
      .enter()
      .append("circle")
      .attr("class", "planet-dot")
      .attr("cx", (p) => planetPositions.get(p.name)?.x ?? 0)
      .attr("cy", (p) => planetPositions.get(p.name)?.y ?? 0)
      .attr("r", 12)
      .attr("fill", (p) => PLANET_COLORS[p.name] ?? "#FFF")
      .attr("opacity", 0.9)
      .attr("filter", "url(#planet-glow)")
      .style("cursor", "pointer")
      .on("mouseenter", function (event, p) {
        const pos = planetPositions.get(p.name);
        setTooltip({
          planet: p.name,
          sign: p.sign,
          degree: Math.round(p.degree * 100) / 100,
          house: p.house ?? "-",
          isRetrograde: p.isRetrograde,
          x: event.offsetX,
          y: event.offsetY,
        });
        setActivePlanet(p.name);
        d3.select(this).attr("r", 16).attr("opacity", 1);
      })
      .on("mouseleave", function () {
        setTooltip(null);
        setActivePlanet(null);
        d3.select(this).attr("r", 12).attr("opacity", 0.9);
      })
      .on("click", function (_event, p) {
        setActivePlanet(activePlanet === p.name ? null : p.name);
      });

    // Planet glyph labels
    planetGroup
      .selectAll(".planet-label")
      .data(data.planets)
      .enter()
      .append("text")
      .attr("class", "planet-label")
      .attr("x", (p) => (planetPositions.get(p.name)?.x ?? 0))
      .attr("y", (p) => (planetPositions.get(p.name)?.y ?? 0))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "16px")
      .attr("fill", "#0A0A1A")
      .attr("pointer-events", "none")
      .text((p) => PLANET_GLYPHS[p.name] ?? p.name[0]);

    // Ascendant marker (special)
    const ascAngle = longitudeToRadians(data.ascendant.longitude, ascLon);
    const ascX = Math.cos(ascAngle) * (houseRadius + 15);
    const ascY = Math.sin(ascAngle) * (houseRadius + 15);

    g.append("text")
      .attr("x", ascX)
      .attr("y", ascY - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#FFD700")
      .text("ASC");

    // MC marker
    const mcAngle = longitudeToRadians(data.midheaven.longitude, ascLon);
    const mcX = Math.cos(mcAngle) * (houseRadius + 15);
    const mcY = Math.sin(mcAngle) * (houseRadius + 15);

    g.append("text")
      .attr("x", mcX)
      .attr("y", mcY - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#FFD700")
      .text("MC");

    // ================================================================
    // CENTER — Chart title
    // ================================================================
    g.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-family", "var(--font-display), serif")
      .attr("font-size", "13px")
      .attr("fill", "rgba(255,255,255,0.5)")
      .text("NATAL CHART");

    g.append("text")
      .attr("x", 0)
      .attr("y", 8)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "rgba(255,255,255,0.3)")
      .text(`ASC ${data.ascendant.sign}`);

    // ================================================================
    // GLOW FILTERS
    // ================================================================
    const defs = svg.append("defs");

    const glowFilter = defs
      .append("filter")
      .attr("id", "planet-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "2")
      .attr("result", "blur");

    glowFilter
      .append("feMerge")
      .selectAll("feMergeNode")
      .data(["blur", "SourceGraphic"])
      .enter()
      .append("feMergeNode")
      .attr("in", (d) => d);
  }, [data, width, height, activePlanet]);

  return (
    <div className="relative inline-block">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="chart-wheel"
        style={{ maxWidth: "100%", height: "auto" }}
      />
      {tooltip && (
        <div
          className="absolute z-50 glass-card px-3 py-2 text-xs pointer-events-none"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 10,
            transform: "translate(-50%, -100%)",
            minWidth: "140px",
          }}
        >
          <div className="font-bold text-sm" style={{ color: PLANET_COLORS[tooltip.planet] }}>
            {PLANET_GLYPHS[tooltip.planet]} {tooltip.planet}
            {tooltip.isRetrograde && " ℞"}
          </div>
          <div className="text-lunar/80">
            {tooltip.degree.toFixed(2)}° {tooltip.sign}
            {typeof tooltip.house === "number" && ` · ${tooltip.house}H`}
          </div>
        </div>
      )}
    </div>
  );
}
