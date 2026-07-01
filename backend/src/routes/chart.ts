import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { calculateChart } from "../lib/ephemeris.js";

export const chartRouter = Router();

const ChartRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Time must be HH:MM (00:00-23:59)"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * POST /api/calculate-chart
 * Calculate a natal chart from birth data
 */
chartRouter.post("/calculate-chart", (req: Request, res: Response) => {
  try {
    const parsed = ChartRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { date, time, latitude, longitude } = parsed.data;

    const chart = calculateChart(date, time, latitude, longitude);

    return res.json({
      success: true,
      data: chart,
      meta: {
        date,
        time,
        latitude,
        longitude,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Chart calculation error:", error);
    return res.status(500).json({
      error: "Failed to calculate chart",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
