# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/); versioning follows
[Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-07-14

### Added

- Structured JSON logging (`lib/logger.ts`, pino) with per-request child
  loggers and a request ID propagated via `X-Request-Id`.
- Rate limiting on `/api/results` (`lib/rate-limit.ts`), with `429` +
  `Retry-After` on limit breach.
- Query parameter validation on `/api/results` via `zod`
  (`?cohort=early|mid|late|pooled` to fetch a single cohort's series).
- `/api/metrics` — Prometheus text-exposition-format endpoint.
- `/api/health` upgraded to a real readiness probe (checks the data bundle
  loaded successfully; returns 503 when degraded).
- `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx` for production-grade
  error/empty/loading states.
- Accessibility: skip link, landmark `aria-labelledby` on sections, table
  `<caption>`s, `sr-only` chart data summaries, automated `jest-axe` coverage.
- Content-Security-Policy, HSTS (prod), COOP/CORP headers.
- Architecture Decision Records (`docs/adr/`).
- Repo hygiene: `CODEOWNERS`, PR template, issue templates, `SECURITY.md`,
  `CONTRIBUTING.md`, Dependabot config.
- CI: `npm audit`, a11y test run added to the test job.

### Changed

- `/api/results` is now `force-dynamic` (was `force-static`) to support
  rate limiting and query params; the main dashboard page itself remains
  statically generated.

## [1.0.0] - 2026-07-14

### Added

- Initial dashboard: event study charts, cohort ATT comparison, PSM balance
  table/chart, summary cards.
- Data pipeline (`scripts/prepare-data.mjs`) converting Python analysis
  outputs into `data/results.json`.
- Jest + React Testing Library unit/component tests, Playwright e2e tests.
- Makefile, multi-stage Dockerfile, GitHub Actions CI.
