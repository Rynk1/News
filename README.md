# NewsIntel

An executive news-intelligence dashboard: AI "agents" watch configured news
sources and topics, then surface digests, sentiment, trending topics, and
executive insights. Includes subscription tiers, a Kindle-style reader, and an
admin dashboard.

> **Status: real auth + backend (Supabase), with a demo fallback.**
> When `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set, the app uses
> Supabase for authentication and persists profiles, subscriptions, and agents
> (row-level security keeps each user's data isolated). When those variables
> are **not** set, the app falls back to the original in-memory **mock data**
> ("demo mode") so it stays runnable without a backend. Article ingestion
> (the autonomous scraping/AI pipeline) is still mock and is the next step —
> see the roadmap below.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
- [React Router](https://reactrouter.com/)
- Tempo devtools (visual editing, optional)

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env   # then fill in values as needed
npm run dev            # start the dev server (http://localhost:5173)
```

## Scripts

| Command             | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with HMR                    |
| `npm run build`     | Type-check (`tsc --noEmit`) **and** build for prod    |
| `npm run typecheck` | Type-check only, no emit                              |
| `npm run lint`      | Run ESLint over `.ts`/`.tsx` files                    |
| `npm run preview`   | Preview the production build locally                  |

## Environment variables

Copy `.env.example` to `.env`. Only variables prefixed with `VITE_` are exposed
to the browser bundle — and anything exposed to the browser is **public**.
Never put secret keys (OpenAI, Stripe secret, database credentials) behind a
`VITE_` prefix; those belong on a backend server. The server-side blueprint in
`src/config/environment.ts` reads the non-`VITE_` variables via `process.env`.

## Backend setup (Supabase)

The backend is [Supabase](https://supabase.com/) (hosted Postgres + Auth),
called directly from the browser with the public anon key.

1. Create a project at [supabase.com](https://supabase.com/) (or run it
   locally with the Supabase CLI).
2. Apply the schema: open the SQL editor and run
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   (or `supabase db push` with the CLI). It creates the `profiles`, `agents`,
   `articles`, `saved_articles`, `annotations`, and `usage_events` tables,
   enables row-level security, and adds a trigger that creates a profile row
   for every new auth user.
3. Copy your project URL and anon key into `.env`:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart `npm run dev`. You'll now get a login/registration screen and all
   data persists to Supabase.

With no Supabase env vars set, the app runs in demo mode (auto-signed-in mock
user, in-memory data) — useful for local UI work and for CI.

## Project structure

```
src/
  components/      UI: dashboard, agents, admin, reader, subscription, ui/ (shadcn)
  contexts/        React context (NewsContext) for shared app state
  services/        Data layer
    *Service.ts        mock services the UI uses today (in-memory)
    real*Service.ts    backend blueprint (NOT wired in; server-only)
  config/          environment.ts (server config blueprint)
  types/           supabase.ts (generated types)
```

## Continuous integration

`.github/workflows/ci.yml` runs lint, typecheck, and build on every pull
request and on pushes to `main`/`master`.

## Roadmap to production

This app is a functional prototype. To make it production-ready and truly
autonomous:

1. **Stabilize** (done): build fails on type errors, ESLint configured, CI
   added, dead backend code quarantined from the client build.
2. **Backend + auth + persistence** (in progress): Supabase Auth + Postgres
   with RLS; profiles, subscriptions, and agents persist per user; UI wired off
   mock data for auth and agents. Remaining: article ingestion + saved
   articles/annotations persistence (depend on real articles from step 3) and
   admin analytics.
3. **Autonomy**: a server-side scheduler/worker (e.g. Supabase Edge Functions
   + cron) that runs each agent on its frequency (scrape → AI analysis →
   synthesis → notify) and writes `articles`.
4. **Payments & hardening**: Stripe checkout + webhooks, Sentry, tests, and a
   dependency/security review.
