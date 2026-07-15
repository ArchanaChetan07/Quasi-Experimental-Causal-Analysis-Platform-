## What & why

<!-- What does this change do, and what problem does it solve? -->

## How to review

<!-- Anything a reviewer should pay special attention to. -->

## Checklist

- [ ] Dashboard CI gate passes (`cd web-dashboard && make ci`)
- [ ] Added/updated tests for the behavior change
- [ ] Updated root `README.md` / ADRs if this changes architecture
- [ ] Updated `web-dashboard/CHANGELOG.md` when applicable
- [ ] No new `console.log` — use `web-dashboard/lib/logger.ts`
- [ ] Screenshots/GIF attached for visual changes

## Risk & rollback

<!-- What's the blast radius if this is wrong? How would we roll it back? -->
