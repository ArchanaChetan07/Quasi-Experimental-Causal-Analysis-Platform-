# Load testing

We use [k6](https://k6.io) for load testing rather than a custom script,
since it gives us percentile latency thresholds and pass/fail exit codes
for free — the same tool can gate a deploy in CI once we have a staging
environment to point it at.

## Run locally

```bash
# install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
make build && make start &   # or point BASE_URL at a running instance
k6 run load-test/dashboard.js
```

## Tuning

```bash
VUS=50 DURATION=2m k6 run load-test/dashboard.js
BASE_URL=https://staging.example.com k6 run load-test/dashboard.js
```

## What "good" looks like

The script's thresholds (`p95 < 500ms`, `p99 < 1s`, error rate `< 1%`) are
starting points, not tuned production SLOs — recalibrate once you have real
traffic data. If `/api/results` (currently rate-limited at 120 req/min per
client, see `lib/rate-limit.ts`) starts returning meaningful volumes of 429s
under expected real-world traffic, that's a signal to raise the limit or
move to a shared/distributed limiter (see `docs/adr/0002-*.md`), not to
disable rate limiting.

## Not yet automated in CI

This is deliberately not wired into the GitHub Actions workflow yet — it
needs a stable staging target to be meaningful (load-testing a fresh CI
container tells you about the CI runner, not your production
infrastructure). Once staging exists, add a scheduled workflow that runs
this against it and alerts on threshold failures.
