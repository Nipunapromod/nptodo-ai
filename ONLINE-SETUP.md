# NPtodo AI — online setup checklist

## 1. Apply the database migration

1. Open the Supabase project for NPtodo AI.
2. Open SQL Editor.
3. Run `supabase/migrations/202610260001_initial_schema.sql` from this repository.
4. Confirm it completes without errors. The migration creates user-owned tables and RLS policies.

## 2. Configure Supabase Auth

1. Open Authentication → Providers and enable Email.
2. Choose whether to require email confirmation.
3. In Authentication URL Configuration, add the production redirect URL:
   `https://nptodo-ai.vercel.app/**`
4. Add any preview domain you will actually use, if needed.

## 3. Add the Supabase environment variables in Vercel

Open Vercel → nptodo-ai → Settings → Environment Variables. Add the following for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the Supabase publishable key (or legacy anon key).
- `SUPABASE_SERVICE_ROLE_KEY`: the Supabase service-role key, **server-only**. Never put it in a `NEXT_PUBLIC_` variable or GitHub.

Save and redeploy after setting these values. Never paste these keys into public source code or chat.

## 4. Configure the AI provider

1. Create an AI Gateway API key in your Vercel AI Gateway settings.
2. Add `AI_GATEWAY_API_KEY` as a server-only encrypted environment variable.
3. Optionally add `AI_GATEWAY_MODEL` with a supported model identifier.
4. Redeploy and test `/assistant`.

The assistant is designed to return a proposal. The user must confirm before a task or schedule is saved.

## 5. Configure reminders

The repository contains a protected route at `/api/cron/reminders` and a SQL example at `supabase/schedules/reminder-cron.sql`.

1. In Vercel, set a strong random value for `REMINDER_JOB_SECRET`.
2. In the SQL example, replace the placeholder secret with the exact same value, then run it in Supabase SQL Editor.
3. Confirm Supabase Cron shows the job as scheduled.
4. Test the endpoint from the Cron job and inspect Supabase logs and Vercel logs.
5. Do not add the real secret to GitHub. The example file must contain only the placeholder.

## 6. Web Push

Vercel has been configured with generated VAPID environment variables for the project. If you rotate them, update all of these together:

- `VAPID_PUBLIC_KEY` (server-side)
- `VAPID_PRIVATE_KEY` (server-side secret)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (public key used by the browser)
- `VAPID_SUBJECT` (a valid mailto: contact or HTTPS URL)

After changing environment variables, redeploy. Push subscriptions are saved in Supabase under the authenticated user's account.

## 7. Stage verification

- Register and sign in at `/signup` and `/login`.
- Create a task at `/tasks`, refresh, and verify it persists.
- Add lessons and marks at `/study`.
- Submit an AI request at `/assistant` and confirm its proposal before saving.
- Enable notifications at `/notifications`.
- Create a recurring schedule, then verify the cron job invokes the reminder endpoint.

## Current limits

This repository has been updated through the first online implementation of the AI assistant, task CRUD, study tracker, recurring schedule UI, Web Push subscription flow, and reminder processor. A full production readiness claim still depends on setting the Supabase and AI credentials, applying the SQL migration, configuring Cron, and verifying the latest Vercel build and actual delivery. Do not assume a saved schedule means a notification was sent.
