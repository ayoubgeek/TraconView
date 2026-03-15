-- Migration: fix compute-radar-snapshots cron job URL
-- The previous migration (20260314000001) contained a placeholder URL
-- ('your-project-ref'). This migration replaces it with one that reads the
-- Supabase project URL from a database configuration variable so no SQL
-- migration file ever needs a hardcoded project ref.
--
-- REQUIRED SETUP (one-time, in Supabase Dashboard):
--   Database > Settings > Configuration > Custom Config — add:
--     app.supabase_url = https://<your-project-ref>.supabase.co/functions/v1
--
--   This can also be set via psql:
--     ALTER DATABASE postgres SET app.supabase_url TO
--       'https://<your-project-ref>.supabase.co/functions/v1';

-- Reschedule with dynamic URL from database config
SELECT cron.unschedule('compute-radar-snapshots');

SELECT cron.schedule(
  'compute-radar-snapshots',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
      url:=current_setting('app.supabase_url', true) || '/compute-snapshot',
      headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:='{}'::jsonb
  );
  $$
);
