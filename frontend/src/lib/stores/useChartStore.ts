/**
 * Chart Data Store (Zustand)
 * Shared chart state accessible across all modes (Natal Chart, Karmic Path, Mystic Depths).
 * Any mode can write or read chart data without relying on sessionStorage.
 */

import { create } from "zustand";
import type { ChartWheelData } from "@/lib/chartRenderer";

interface ChartMeta {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
}

interface ChartState {
  /** The chart wheel data for visual rendering */
  wheelData: ChartWheelData | null;
  /** Raw chart API response data */
  chartData: any;
  /** Chart metadata (birth info) */
  chartMeta: ChartMeta | null;
  /** Whether chart has been loaded */
  hasChart: boolean;

  /** Set chart data from API response */
  setChart: (rawData: any, wheel: ChartWheelData, meta: ChartMeta) => void;
  /** Clear chart data */
  clearChart: () => void;
  /** Set from raw session data */
  setFromSessionData: (data: any) => void;
}

export const useChartStore = create<ChartState>((set) => ({
  wheelData: null,
  chartData: null,
  chartMeta: null,
  hasChart: false,

  setChart: (rawData, wheel, meta) => {
    set({
      chartData: rawData,
      wheelData: wheel,
      chartMeta: meta,
      hasChart: true,
    });
    // Also store in sessionStorage for cross-page persistence
    try {
      sessionStorage.setItem("astroData", JSON.stringify(rawData));
    } catch {}
  },

  clearChart: () => {
    set({
      wheelData: null,
      chartData: null,
      chartMeta: null,
      hasChart: false,
    });
    try {
      sessionStorage.removeItem("astroData");
    } catch {}
  },

  setFromSessionData: (data) => {
    if (data?.success && data?.data) {
      set({
        chartData: data,
        wheelData: data.data as ChartWheelData,
        chartMeta: data.meta ?? null,
        hasChart: true,
      });
    }
  },
}));
