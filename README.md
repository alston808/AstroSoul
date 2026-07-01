# 🌌 AstroSoul

**Hyper-personalized astrology insights powered by exact astronomical calculations and ancient wisdom texts.**

## Overview

AstroSoul calculates your exact natal chart using Swiss Ephemeris (via `@swisseph/node`) and generates personalized readings by combining your chart placements with a RAG (Retrieval-Augmented Generation) system that draws from classical astrology texts.

### Modes
- ✦ **Natal Chart** — Full D3.js visual chart wheel with planets, houses, and aspects
- ✦ **Karmic Path** — North & South Node analysis (Lisa Wagner's Karmic Astrology)
- ✦ **Mystic Depths** — 4th, 8th, 12th house insights (Tayannah Lee McQuillar's Astrology for Mystics)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, D3.js, Framer Motion, Zustand |
| Backend | Express 5, TypeScript, Swiss Ephemeris, Zod |
| Database | Supabase (PostgreSQL) — Auth + User Data |
| AI/ML | LangChain, OpenAI, Pinecone (RAG pipeline) |
| Runtime | Bun |

## Project Structure

```
AstroSoul/
├── frontend/          # Next.js 15 app
│   └── src/
│       ├── app/       # Pages & routes
│       ├── components/# React components
│       └── lib/       # Utilities, Supabase clients, stores
├── backend/           # Express 5 API
│   └── src/
│       ├── routes/    # API endpoints
│       └── lib/       # Ephemeris, placements, AI
├── data-pipeline/     # Python RAG ingestion pipeline
├── supabase/          # Database schema & migrations
│   └── schema.sql
└── package.json       # Monorepo root
```

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (≥1.0)
- Python 3.11+ (for data pipeline)
- Supabase account (for auth & database)

### Installation

```bash
# Install all dependencies
bun run install:all

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase URL & anon key
```

### Environment Variables

```env
# Supabase (New API Key format)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here

# Backend
PORT=3001
OPENAI_API_KEY=sk-...   # (optional, falls back to mock)
OPENROUTER_API_KEY=...  # (optional)
```

### Development

```bash
# Start both frontend & backend
bun run dev

# Or individually
bun run dev:frontend  # → http://localhost:3000
bun run dev:backend   # → http://localhost:3001
```

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the schema:
   ```bash
   # Via Supabase CLI
   supabase db push
   
   # Or manually via SQL Editor
   cat supabase/schema.sql
   ```
3. Enable Auth providers (Email/Password at minimum) in Supabase Dashboard → Authentication → Providers

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/calculate-chart` | Calculate natal chart from birth data |
| POST | `/api/generate-reading` | Generate AI reading (chart + RAG) |
| GET | `/api/health` | Health check |

## License

MIT
