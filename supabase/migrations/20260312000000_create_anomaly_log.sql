-- Supabase SQL Migration: Create anomaly_log table

CREATE TABLE IF NOT EXISTS public.anomaly_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  icao24 text NOT NULL,
  callsign text,
  type text NOT NULL,
  severity text NOT NULL,
  altitude numeric,
  speed numeric,
  vertical_rate numeric,
  squawk text,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_anomaly_log_created_at ON public.anomaly_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_severity ON public.anomaly_log(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_icao24 ON public.anomaly_log(icao24);

-- Set up Row Level Security (RLS)
ALTER TABLE public.anomaly_log ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (from edge function or client)
CREATE POLICY "Allow public insert to anomaly_log"
  ON public.anomaly_log FOR INSERT
  WITH CHECK (true);

-- Allow public read access (if needed for historical endpoints later)
CREATE POLICY "Allow public read access to anomaly_log"
  ON public.anomaly_log FOR SELECT
  USING (true);
