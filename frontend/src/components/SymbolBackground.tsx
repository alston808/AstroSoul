"use client";

import { getSymbol, type SymbolEntry } from "@/lib/symbols";
import Image from "next/image";

interface SymbolBackgroundProps {
  /** Symbol ID from the catalog */
  symbol: string;
  /** Opacity of the overlay image (0-1) */
  opacity?: number;
  /** Blend mode for the background image */
  blendMode?: "overlay" | "screen" | "soft-light";
  /** Whether to tint the image with the symbol's neon color */
  tint?: boolean;
  children: React.ReactNode;
}

export default function SymbolBackground({
  symbol,
  opacity = 0.15,
  blendMode = "screen",
  tint = true,
  children,
}: SymbolBackgroundProps) {
  const entry: SymbolEntry | undefined = getSymbol(symbol);

  const fallbackStyle: React.CSSProperties = {
    background: entry
      ? `radial-gradient(ellipse at center, ${entry.neonColor}15 0%, transparent 70%)`
      : "none",
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background image layer */}
      {entry && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ opacity, mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"] }}
        >
          <Image
            src={entry.imagePath}
            alt={entry.name}
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
        </div>
      )}

      {/* Neon color tint overlay */}
      {tint && entry && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${entry.neonColor}20 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Fallback gradient when no image loaded */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={fallbackStyle} />

      {/* Content layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Get the neon color for a symbol, with fallback
 */
export function getNeonColor(id: string): string {
  return getSymbol(id)?.neonColor ?? "#8B00FF";
}

/**
 * Get the shadow class for a symbol, with fallback
 */
export function getShadowClass(id: string): string {
  return getSymbol(id)?.shadowClass ?? "shadow-neon-purple";
}
