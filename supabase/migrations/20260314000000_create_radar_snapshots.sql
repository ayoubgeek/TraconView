-- Migration: Create Radar Snapshots table for telemetry and statistics

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.radar_snapshots (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    region text NOT NULL,
    snapshot_time timestamptz NOT NULL,
    computed_at timestamptz NOT NULL DEFAULT now(),
    total_aircraft int NOT NULL DEFAULT 0,
    in_flight int NOT NULL DEFAULT 0,
    active_anomalies int NOT NULL DEFAULT 0,
    coverage_percent int NOT NULL DEFAULT 0,
    statistics jsonb NOT NULL DEFAULT '{}'::jsonb,
    trends jsonb NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE(region, snapshot_time)
);

-- Optimize queries for latest snapshots
CREATE INDEX idx_radar_snapshots_time_desc ON public.radar_snapshots (snapshot_time DESC);
CREATE INDEX idx_radar_snapshots_region_time ON public.radar_snapshots (region, snapshot_time DESC);

-- Enable Row Level Security
ALTER TABLE public.radar_snapshots ENABLE ROW LEVEL SECURITY;

-- 1. Public SELECT Policy: Anyone can read snapshots (or just authenticated if desired, keeping public as TraconView might be a public dashboard or user-facing without login based on previous model)
-- Adjust based on actual project auth needs, using 'true' for public access based on requirement "public SELECT".
CREATE POLICY select_radar_snapshots ON public.radar_snapshots
    FOR SELECT
    USING (true);

-- 2. Service-Role INSERT Policy: Only Edge Functions using service_role key can insert
CREATE POLICY insert_radar_snapshots ON public.radar_snapshots
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role' OR current_user = 'postgres');

-- Clean up function to be called via cron to purge old snapshots
CREATE OR REPLACE FUNCTION clean_old_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete snapshots older than 24 hours
    DELETE FROM public.radar_snapshots
    WHERE snapshot_time < NOW() - INTERVAL '24 hours';
END;
$$;
