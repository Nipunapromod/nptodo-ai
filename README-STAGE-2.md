# NPtodo AI — Stage 2 setup

This commit adds the Supabase-backed account flow, a real task list, and the initial user-owned schema.

## Configure Supabase

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open SQL Editor and run `supabase/migrations/202610260001_initial_schema.sql`.
3. In Authentication settings, enable Email provider. Choose whether email confirmation is required.
4. Add the production website URL and the local redirect URL only if you plan to use local development to the Supabase Auth redirect allow-list.
5. In Vercel → Project → Settings → Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Apply variables to Production and Preview, save, then redeploy.

## Routes

- `/login`: sign in with email and password.
- `/signup`: create an account.
- `/tasks`: Supabase-backed task create/complete/delete.

## Notes

- This stage requires a real Supabase project and environment variables before sign-in and task storage can work.
- The schema enables RLS for all user-owned tables and seeds Combined Mathematics, Physics, and Chemistry for each new profile.
- Reminder processing, AI actions, and push delivery are not implemented by this stage yet.
