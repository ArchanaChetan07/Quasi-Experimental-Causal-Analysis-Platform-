# Causal Inference Dashboard

A production Next.js dashboard for the staggered-rollout causal inference
analysis (difference-in-differences + propensity score matching). It turns
the Python analysis outputs into an interactive, testable, deployable web app.

## What this is

- **Frontend:** Next.js 15 (App Router) + TypeScript + Recharts, server-rendered
  and statically generated at build time (no client-side data fetching waterfall).
- **Data layer:** `data/results.json` is a pre-computed bundle generated from
  the upstream Python DiD/PSM analysis (`analysis-source/*.csv` + `*.txt`) via
  `npm run prepare-data`, then validated with Zod at load time. The app never
  re-runs statistics at request time.
- **API:** `/api/results` (rate-limited JSON bundle, `force-dynamic`) and
  `/api/health` / `/api/metrics` (liveness / ops probes).
- **Tests:** Jest + React Testing Library (unit/component + a11y) and Playwright
  (end-to-end smoke tests).
- **Ops:** Makefile, multi-stage Dockerfile (standalone Next.js output, non-root
  user, healthcheck, `prepare-data` during image build), GitHub Actions CI at
  repo root (lint, typecheck, test, e2e, Docker smoke), and security headers
  (`next.config.mjs`).

## Quickstart

```bash
make install        # npm ci
make prepare-data   # regenerate data/results.json from analysis-source/
make dev            # http://localhost:3000
```

Or without `make`:

```bash
npm install
npm run prepare-data
npm run dev
```

## Common tasks

| Task | Command |
|---|---|
| Dev server | `make dev` / `npm run dev` |
| Production build | `make build` / `npm run build` |
| Start production build | `make start` / `npm run start` |
| Unit/component tests | `make test` / `npm test` |
| Watch tests | `make test-watch` |
| E2E tests (Playwright) | `make test-e2e` |
| Lint | `make lint` / `npm run lint` |
| Typecheck | `make typecheck` / `npm run typecheck` |
| Format | `make format` |
| **Full CI gate locally** | `make ci` |
| Docker build | `make docker-build` |
| Docker run | `make docker-run` |

`make ci` runs the exact same gate as GitHub Actions (`install → lint →
typecheck → test → build`) so you can catch failures before pushing.

## Updating the data

The dashboard is decoupled from the Python analysis by design: it reads a
single JSON bundle rather than importing Python or calling out to it at
runtime. To refresh the dashboard after re-running the analysis:

1. Copy the new `output/*.csv` and `output/*.txt` files from the Python
   pipeline into `analysis-source/`.
2. Run `npm run prepare-data` (or `make prepare-data`). This regenerates
   `data/results.json` and fails loudly (`Error: Missing expected analysis
   output: ...`) if an expected file is missing, rather than silently
   serving stale or partial data.
3. Commit the updated `data/results.json` — it's treated as a build input,
   not a runtime dependency, so the deployed app doesn't need Python at all.

## Project structure

```
app/
  page.tsx                 Main dashboard (server component)
  layout.tsx                Root layout + metadata
  globals.css                Design tokens / dark theme
  api/results/route.ts       JSON API for the results bundle
  api/health/route.ts        Liveness probe
components/                 Chart + UI components (client components where needed)
lib/
  types.ts                   Shared TypeScript types for the results bundle
  data.ts                    Server-side data loader (cached, fails loudly if data is missing)
scripts/prepare-data.mjs    Converts analysis-source/*.csv,*.txt -> data/results.json
analysis-source/            Raw outputs copied from the Python analysis pipeline
data/results.json           Generated data bundle consumed by the app (checked in)
__tests__/                  Jest unit/component tests
e2e/                         Playwright end-to-end tests
```

## Design decisions worth knowing

- **Why pre-computed JSON instead of a live backend?** The statistics
  (DiD, event studies, PSM) are computed once by the Python pipeline and
  don't change per-request. Serving a static bundle means the frontend has
  zero runtime dependency on Python/pandas/statsmodels, builds are
  reproducible, and the whole app can be statically generated
  (`export const dynamic = "force-static"`), which is both faster and
  cheaper to host.
- **Why keep the "naive TWFE" number on the dashboard instead of hiding it?**
  The whole point of the underlying analysis is that the naive estimate is
  biased and shouldn't be reported as the headline number, but hiding it
  would defeat the "don't present a single causal estimate as unconditionally
  valid" principle the project was built around — the dashboard shows it
  alongside the parallel-trends test that explains why it's untrustworthy.
- **Why not fetch `/api/results` from the client?** The page is a server
  component that calls `getResults()` directly, avoiding an unnecessary
  client-side fetch waterfall on first load. `/api/results` still exists
  as a stable JSON endpoint for other consumers (e.g. a future mobile app,
  or `curl`).

## Deployment

The included `Dockerfile` produces a small, non-root, standalone image:

```bash
make docker-build
make docker-run   # serves on http://localhost:3000
```

It can also be deployed directly to any Next.js-compatible platform (Vercel,
Fly.io, a plain Node host) — just run `npm run build && npm run start` (or,
for the Docker path, set `DOCKER_BUILD=1` during build so Next.js emits the
`standalone` output the Dockerfile expects).

## Known limitations / next steps for a real startup deployment

- No authentication — this dashboard currently assumes an internal,
  trusted audience. Add an auth layer (e.g. NextAuth, or a reverse-proxy
  SSO) before exposing it externally.
- No telemetry/error tracking wired up yet (e.g. Sentry) — recommended
  before production traffic.
- The Python analysis pipeline itself is not containerized alongside this
  app; it's treated as an offline data-prep step. If the rollout needs
  live/streaming updates, `prepare-data` would need to run on a schedule
  (cron/CI) rather than manually.
