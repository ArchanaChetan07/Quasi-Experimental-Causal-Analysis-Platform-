# Contributing

## Local setup

```bash
make install
make prepare-data
make dev
```

## Before opening a PR

Run the same gate CI runs:

```bash
make ci
```

This runs, in order: install → lint → typecheck → test → build. Fix any
failures locally before pushing — it's faster than iterating on CI.

For UI changes, also run the e2e suite once:

```bash
make test-e2e
```

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add cohort filter to /api/results
fix: correct SMD sign in balance table
docs: add ADR for rate limiting approach
test: add a11y coverage for SummaryCards
chore: bump next to 14.2.35 (security)
```

This keeps `CHANGELOG.md` easy to write and makes `git log` skimmable.

## Architecture changes

If your change affects how the app is structured, deployed, or makes a
non-obvious tradeoff, add an ADR under `docs/adr/` (copy
`docs/adr/template.md`). Small refactors don't need one; decisions someone
will ask "why did we do it this way?" about in six months do.

## Code style

- TypeScript strict mode is on — don't add `any` without a comment
  explaining why it's unavoidable.
- Prefer server components; only add `"use client"` when you need
  interactivity, browser APIs, or a client-only library (e.g. Recharts).
- Use `lib/logger.ts` for anything server-side worth logging — no bare
  `console.log` in application code (tests and one-off scripts are fine).
- New API routes should follow the pattern in `app/api/results/route.ts`:
  request ID, rate limit check, input validation, structured log on success
  and failure.

## Tests

- Unit/component tests live in `__tests__/`, colocated by concern, not by
  file-for-file mirroring of `components/`.
- Every new component should have at least a render smoke test; components
  with logic (formatting, conditional rendering, computed values) should
  have assertions on that logic, not just "it renders."
- Accessibility: if you add a new interactive component or data table, add
  it to `__tests__/a11y.test.tsx`.
