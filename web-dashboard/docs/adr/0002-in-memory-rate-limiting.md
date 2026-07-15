# ADR 0002: In-memory rate limiting, with an explicit upgrade path to Redis

**Status:** Accepted
**Date:** 2026-07-14
**Deciders:** Dashboard engineering

## Context

`/api/results` is a public-ish JSON endpoint. We want basic abuse protection
(a misbehaving client or scraper hammering the endpoint) without introducing
new infrastructure (Redis, a managed rate-limit service) before there's a
demonstrated need for one.

## Decision

Implement a simple in-memory sliding-window counter (`lib/rate-limit.ts`),
keyed by client IP, with a documented limitation: it is per-process and
does **not** coordinate across multiple server instances.

## Alternatives considered

- **Redis-backed rate limiting (e.g. `@upstash/ratelimit`)** — the correct
  choice once the app runs on more than one instance behind a load balancer,
  since in-memory counters would let a client get `N requests × instance
  count` before being limited anywhere. Deferred until horizontal scaling
  is actually in place, to avoid taking on a Redis dependency for a
  single-instance deployment.
- **Rate limiting at the edge/gateway (Cloudflare, API Gateway, nginx)** —
  often the better production answer since it stops traffic before it
  reaches the app at all. Complementary to, not a replacement for,
  application-level limiting (defense in depth) — recommended in addition
  to this once a real gateway is in place.
- **No rate limiting** — rejected; a public JSON endpoint with no limiting
  is a trivial scraping/DoS target.

## Consequences

- Single-instance deployments (the current default target — see
  `Dockerfile`/`docker-run`) get real protection today with zero new
  infrastructure.
- The call site is isolated to one function (`checkRateLimit` in
  `app/api/results/route.ts`), so swapping in a Redis-backed limiter later
  is a one-file change, not a rewrite.
- **Follow-up required before multi-instance deployment:** replace
  `lib/rate-limit.ts`'s in-memory `Map` with a shared store. Tracked as a
  known gap in `README.md`.
