-- ============================================================================
-- AstroSoul Supabase Schema
-- ============================================================================
-- Run this in the Supabase SQL Editor to set up your database.
-- Requires: Supabase Auth enabled (Email provider)
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- Enable UUID generation
-- ───────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────────────────────
-- Profiles Table (extends Supabase Auth users)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  birth_date    DATE,
  birth_time    TIME,
  birth_lat     DOUBLE PRECISION,
  birth_lng     DOUBLE PRECISION,
  birth_tz      TEXT DEFAULT 'UTC',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ───────────────────────────────────────────────────────────────────────────
-- Birth Charts Table
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.birth_charts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT,
  birth_date    DATE NOT NULL,
  birth_time    TIME NOT NULL,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  timezone      TEXT DEFAULT 'UTC',
  ascendant_sign       TEXT,
  ascendant_degree     DOUBLE PRECISION,
  midheaven_sign       TEXT,
  midheaven_degree     DOUBLE PRECISION,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.birth_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own charts"
  ON public.birth_charts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own charts"
  ON public.birth_charts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own charts"
  ON public.birth_charts FOR DELETE
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- Planets Table (one row per planet per chart)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.birth_chart_planets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id      UUID NOT NULL REFERENCES public.birth_charts(id) ON DELETE CASCADE,
  planet_name   TEXT NOT NULL,
  sign          TEXT NOT NULL,
  sign_index    INTEGER NOT NULL,
  degree        DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  house         INTEGER,
  is_retrograde BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.birth_chart_planets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chart planets"
  ON public.birth_chart_planets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.birth_charts bc
    WHERE bc.id = chart_id AND bc.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own chart planets"
  ON public.birth_chart_planets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.birth_charts bc
    WHERE bc.id = chart_id AND bc.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own chart planets"
  ON public.birth_chart_planets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.birth_charts bc
    WHERE bc.id = chart_id AND bc.user_id = auth.uid()
  ));

-- ───────────────────────────────────────────────────────────────────────────
-- House Cusps Table
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.birth_chart_houses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id      UUID NOT NULL REFERENCES public.birth_charts(id) ON DELETE CASCADE,
  house_number  INTEGER NOT NULL,
  sign          TEXT NOT NULL,
  sign_index    INTEGER NOT NULL,
  degree        DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.birth_chart_houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chart houses"
  ON public.birth_chart_houses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.birth_charts bc
    WHERE bc.id = chart_id AND bc.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own chart houses"
  ON public.birth_chart_houses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.birth_charts bc
    WHERE bc.id = chart_id AND bc.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own chart houses"
  ON public.birth_chart_houses FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.birth_charts bc
    WHERE bc.id = chart_id AND bc.user_id = auth.uid()
  ));

-- ───────────────────────────────────────────────────────────────────────────
-- Aspects Table
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.birth_chart_aspects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id      UUID NOT NULL REFERENCES public.birth_charts(id) ON DELETE CASCADE,
  planet1       TEXT NOT NULL,
  planet2       TEXT NOT NULL,
  aspect_type   TEXT NOT NULL,
  angle         DOUBLE PRECISION NOT NULL,
  orb           DOUBLE PRECISION NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.birth_chart_aspects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chart aspects"
  ON public.birth_chart_aspects FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.birth_charts bc
    WHERE bc.id = chart_id AND bc.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own chart aspects"
  ON public.birth_chart_aspects FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.birth_charts bc
    WHERE bc.id = chart_id AND bc.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own chart aspects"
  ON public.birth_chart_aspects FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.birth_charts bc
    WHERE bc.id = chart_id AND bc.user_id = auth.uid()
  ));

-- ───────────────────────────────────────────────────────────────────────────
-- Saved Readings Table
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.saved_readings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chart_id      UUID REFERENCES public.birth_charts(id) ON DELETE SET NULL,
  focus         TEXT NOT NULL DEFAULT 'general' CHECK (focus IN ('general', 'karmic', 'mystic')),
  reading_text  TEXT NOT NULL,
  excerpts_json JSONB DEFAULT '[]'::jsonb,
  placements_json JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own readings"
  ON public.saved_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readings"
  ON public.saved_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own readings"
  ON public.saved_readings FOR DELETE
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- Indexes for Performance
-- ───────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_birth_charts_user_id ON public.birth_charts(user_id);
CREATE INDEX idx_birth_charts_created_at ON public.birth_charts(created_at DESC);
CREATE INDEX idx_planets_chart_id ON public.birth_chart_planets(chart_id);
CREATE INDEX idx_houses_chart_id ON public.birth_chart_houses(chart_id);
CREATE INDEX idx_aspects_chart_id ON public.birth_chart_aspects(chart_id);
CREATE INDEX idx_readings_user_id ON public.saved_readings(user_id);
CREATE INDEX idx_readings_chart_id ON public.saved_readings(chart_id);
CREATE INDEX idx_readings_focus ON public.saved_readings(user_id, focus);

-- ───────────────────────────────────────────────────────────────────────────
-- updated_at trigger function
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
