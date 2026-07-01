import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { chartRouter } from "./routes/chart.js";
import { readingRouter } from "./routes/reading.js";

// Load .env from backend/ or root
const envPath = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "backend", ".env")].find(existsSync);
if (envPath) dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", chartRouter);
app.use("/api", readingRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 AstroSoul backend running on http://localhost:${PORT}`);
});
