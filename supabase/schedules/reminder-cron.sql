-- Run this after the initial schema migration.
-- Before running, set the SAME strong random value in Vercel's REMINDER_JOB_SECRET
-- and replace the placeholder below with that value. Never commit the actual value.
-- Supabase Cron calls the protected Vercel route every minute.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Store the job secret in Supabase Vault. Replace the placeholder before running.
select vault.create_secret(
  'REPLACE_WITH_THE_SAME_RANDOM_SECRET_AS_VERCEL',
  'nptodo_reminder_job_secret',
  'Bearer token used by Supabase Cron to call the NPtodo AI reminder endpoint'
);

-- Remove an older schedule with the same name if this script is rerun.
select cron.unschedule(jobid)
from cron.job
where jobname = 'nptodo-ai-reminder-processor';

select cron.schedule(
  'nptodo-ai-reminder-processor',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://nptodo-ai.vercel.app/api/cron/reminders',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'nptodo_reminder_job_secret'
        limit 1
      ),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $job$
);
