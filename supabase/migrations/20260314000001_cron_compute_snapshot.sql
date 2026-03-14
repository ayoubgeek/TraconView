-- Migration for pg_cron scheduling tasks
-- supabase/migrations/20260314000001_cron_compute_snapshot.sql

-- Enable pg_cron if not already enabled (Supabase typically has this available)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Schedule Edge Function computation every 10 minutes
SELECT cron.schedule(
  'compute-radar-snapshots',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
      url:='https://your-project-ref.functions.supabase.co/compute-snapshot',
      headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:='{}'::jsonb
  );
  $$
);

-- 2. Schedule cleanup function to run once an hour at minute 0
SELECT cron.schedule(
  'clean-old-snapshots',
  '0 * * * *',
  $$SELECT clean_old_snapshots()$$
);
