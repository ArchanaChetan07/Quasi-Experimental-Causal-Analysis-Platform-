# ADR 0001: Serve pre-computed JSON instead of a live statistics backend

**Status:** Accepted
**Date:** 2026-07-14
**Deciders:** Dashboard engineering

## Context

The dashboard needs to display DiD and PSM results (event studies, cohort
ATTs, covariate balance) computed by a Python analysis pipeline
(pandas/statsmodels/sklearn). We need to decide how the Next.js frontend
gets that data: recompute it live, call out to a Python service per request,
or serve a pre-computed artifact.

The statistics are deterministic given the input panel and don't change
between requests — the estimates are a function of historical data that is
refreshed on a data-pipeline cadence (e.g. weekly), not per page view.

## Decision

We generate `data/results.json` once, offline, via `npm run prepare-data`
(which parses the Python pipeline's CSV/TXT outputs), check it into the
repo, and have the Next.js app read it directly from disk at build/request
time. There is no live call to Python, no database, and no per-request
recomputation.

## Alternatives considered

- **Live Python microservice (FastAPI) called via HTTP from Next.js API
  routes.** Rejected for now: adds a second deployable, a second runtime,
  network latency, and a new failure mode (Python service down = dashboard
  down), for data that doesn't actually change per-request. Revisit if/when
  the dashboard needs to support ad-hoc, user-specified DiD queries (e.g.
  "run this analysis on a market subset I pick") rather than fixed,
  pre-defined views.
- **Database (Postgres) with a nightly ETL job populating result tables.**
  Reasonable next step once there are multiple dashboards/consumers of the
  same results, or once historical result versions need to be queryable.
  Overkill for a single dashboard with one data producer.
- **Recompute in Node via a JS port of the statistics.** Rejected: DiD/PSM
  correctness depends on statsmodels' clustered-SE and OLS implementations;
  reimplementing that in JS is unnecessary risk for no benefit.

## Consequences

- The deployed Next.js app has zero runtime dependency on Python — smaller
  attack surface, simpler ops, faster cold starts, works on Vercel/any
  Node host without a Python runtime.
- `/api/results` can be `force-static` for the common case; the cost is that
  a genuinely new data refresh requires a rebuild/redeploy, not just an
  API-side data update. This is an acceptable tradeoff at current cadence
  (data updates roughly as often as the rollout itself progresses) but
  would need revisiting for a real-time use case.
- `scripts/prepare-data.mjs` fails loudly (throws) if an expected upstream
  file is missing, rather than silently serving stale/partial data — this
  was a deliberate choice after an early version of the script used lenient
  regex extraction that silently produced wrong numbers (see git history /
  PR discussion for the extraction bug that motivated tightening this).
