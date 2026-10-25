# NPtodo AI — Stage 1 foundation

NPtodo AI combines task management, a conversational assistant, persistent reminders, and a Sri Lankan A/L study tracker. This repository is currently **Stage 1: foundation and interactive dashboard preview**.

## What's implemented in Stage 1

- Next.js App Router + TypeScript project foundation.
- Tailwind CSS 4 integration and a custom dark, glass-inspired design system.
- Responsive desktop sidebar, mobile drawer navigation, top bar, search routing, and shared AI command window.
- Dashboard composition: task preview list, filter controls, session-only quick add and complete/reopen interactions, sample subject progress, weekly chart, upcoming schedule, and responsive metric cards.
- Framer Motion successor package `motion` with `motion/react` imports, reduced-motion-aware transitions, and CSS reduced-motion support.
- PWA manifest and SVG app icon.
- Placeholder routes for Tasks, Calendar, Recurring Tasks, Study Progress, AI Assistant, Notifications, and Settings. These state which future stage owns the implementation; no placeholder claims those features work.
- `.env.example`, ESLint configuration, and basic Node tests for utility input handling.

## Important preview boundary

There is **no Supabase connection, authentication, AI provider, persistent task API, or push-notification delivery in Stage 1**. Values shown on the dashboard are sample preview data and carry visible labels. Any task added or checked on the dashboard is held only in the current browser session and resets on refresh. AI command attempts are explicitly labelled preview-only and do not make database changes.

## Requirements

- Node.js 20.9 or newer (Node.js 22 LTS recommended).
- npm.
- A modern browser.

## Run locally

1. Extract this folder.
2. Open the folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000`.

For production validation:

```bash
npm test
npm run lint
npm run build
```

Dependency installation was not completed in the authoring environment, so a full Next.js production build has **not** been claimed or certified here. Run the commands above after `npm install` on your machine. The package manifest uses the stable Next.js 16.4.x / React 19.3.x family and Tailwind CSS 4.x ranges at the time this stage was assembled.

## Deploy to Vercel (Stage 1 preview)

1. Create a private GitHub repository named `nptodo-ai`.
2. Upload or push the contents of this folder to its repository root.
3. In Vercel, choose **Add New → Project**, import that repository, and keep the detected Next.js framework settings.
4. No environment variables are required for this Stage 1 preview.
5. Deploy a Preview first and check mobile navigation, task preview interactions, keyboard focus, and reduced-motion preferences.

Do not add real secrets to GitHub. Configure future server secrets directly in Vercel Project Settings → Environment Variables and local secrets in `.env.local` (which is gitignored).

## Planned stages

- **Stage 2:** Supabase project, schema migrations, auth, RLS, server authorization, and persistent task CRUD.
- **Stage 3:** Vercel AI Gateway, server-side model configuration, typed AI tools, natural-language date parsing, authorization and confirmation rules.
- **Stage 4:** Recurrence generation, secure scheduled reminder processor, delivery records, Web Push, and notification center.
- **Stage 5:** Lesson catalog, lesson progress, study sessions, marks records, and analytics based on saved records.
- **Stage 6:** Preferences, accessibility/performance hardening, PWA offline shell, exports, end-to-end checks, and production deployment review.

## Security roadmap

- Never expose `AI_GATEWAY_API_KEY`, `VAPID_PRIVATE_KEY`, `REMINDER_JOB_SECRET`, or a Supabase service-role key to client bundles.
- Stage 2 will apply RLS to user-owned tables and check authenticated user ownership in server actions/routes.
- AI-generated actions will call the same typed service layer as normal UI actions. Models will not receive arbitrary SQL or unrestricted database handles.
- Reminder scheduling will be server-side; a saved task will not be treated as evidence that a push notification was delivered.

## Package and API references

- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS + Next.js: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- Motion for React: https://motion.dev/docs/react
- Supabase Next.js guide (for Stage 2): https://supabase.com/docs/guides/auth/server-side/nextjs
- Vercel AI SDK AI Gateway (for Stage 3): https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway
