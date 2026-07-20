# NewsIntel

An executive news-intelligence dashboard: AI "agents" watch configured news
sources and topics, then surface digests, sentiment, trending topics, and
executive insights. Includes subscription tiers, a Kindle-style reader, and an
admin dashboard.

> **Status: UI prototype.** The app currently runs entirely on in-memory
> **mock data** (see `src/services/*Service.ts`). There is no live backend,
> database, or scheduler yet. A server-side "blueprint" exists under
> `src/config/environment.ts` and `src/services/real*Service.ts` but is **not
> wired into the app** and is excluded from the client build (it uses
> Node-only libraries and must move to a real backend before use). See the
> roadmap below.

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

1. **Stabilize** (this PR): build fails on type errors, ESLint configured, CI
   added, dead backend code quarantined from the client build.
2. **Backend + persistence**: stand up a real API server (or Supabase), move
   all `real*` service logic server-side, provision Postgres/Redis, and replace
   the in-memory mock stores.
3. **Real auth**: server-side JWT/refresh tokens (or Supabase Auth), email
   verification, and login/register/protected-route flows.
4. **Autonomy**: a server-side scheduler/worker that runs each agent on its
   configured frequency (scrape → AI analysis → synthesis → notify).
5. **Payments & hardening**: Stripe checkout + webhooks, Sentry, tests, and a
   dependency/security review.
