-- Supabase SQL Migration: Create anomaly_log table

CREATE TABLE IF NOT EXISTS public.anomaly_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  icao24 text NOT NULL,
  callsign text,
  anomaly_type text NOT NULL,
  severity text NOT NULL,
  latitude double precision,
  longitude double precision,
  altitude_ft integer,
  vertical_rate_fpm integer,
  squawk text,
  speed_kts integer,
  region text,
  detected_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_detected_at ON public.anomaly_log(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_severity ON public.anomaly_log(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_icao24 ON public.anomaly_log(icao24);

ALTER TABLE public.anomaly_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to anomaly_log"
  ON public.anomaly_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to anomaly_log"
  ON public.anomaly_log FOR SELECT
  USING (true);
