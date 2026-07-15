# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.
Instead, email security@example.com with:

- A description of the issue and its potential impact
- Steps to reproduce (a minimal repro is ideal)
- Any relevant request IDs / logs

We aim to acknowledge reports within 2 business days and to provide a fix
or mitigation timeline within 7 days.

## Supported versions

Only the latest release on `main` receives security fixes. This project
does not currently maintain long-term-support branches.

## What's already in place

- Dependencies are scanned weekly via Dependabot (`.github/dependabot.yml`)
  and on every CI run via `npm audit` (see `.github/workflows/ci.yml`).
- Security headers (CSP, HSTS in production, X-Frame-Options,
  X-Content-Type-Options, Permissions-Policy, COOP/CORP) are set in
  `next.config.mjs`.
- The Docker image runs as a non-root user (see `Dockerfile`).
- API routes validate input with `zod` (`lib/schemas.ts`) and are
  rate-limited (`lib/rate-limit.ts`) — see `docs/adr/0002-*.md` for the
  rate-limiting design and its known single-instance limitation.
- No secrets are required for the app to run in its current form (see
  `.env.example`); if that changes, secrets must be provided via the
  runtime environment, never committed.
