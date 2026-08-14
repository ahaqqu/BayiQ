# CONTEXT

Mental model for agents working in BayiQ.

## What this is

BayiQ is a bilingual (Indonesian/English) child immunization tracker, bootstrapped from the `agentic-project-template`.

The original HTML/CSS/JS prototype has been archived under `prototype/` and migrated into a TypeScript/React Cloudflare stack. The repository contains a working immunization vertical slice: bilingual schedule, child/record local-first store with CRDT sync, D1-backed API, and BDD coverage.

## Layout

- `prototype/` — original HTML/CSS/JS prototype with IDAI 2024 schedule data and in-browser `localStorage` persistence.
- `apps/` — the API (`apps/api`, Hono on Cloudflare Workers + D1) and web app (`apps/web`, React PWA).
- `packages/` — shared packages (`contracts`, `infra`, `local-first` rebuilt for immunization records).
- `docs/` — architecture, runbooks, and bootstrap guidance inherited from the template (see `docs/BOOTSTRAP_DEBT.md` for current suppressions).
- `.agents/skills/` — agent workflow skills inherited from the template.
- `.github/workflows/` — CI, vulnerability scan, and template-sync workflows inherited from the template.
- `scripts/` — agentic-limits, template-truth, OpenAPI check, and template-sync utilities inherited from the template.

## Gates

`bun run check` · `bun run test` · `bun run size-limit` · `bun run agentic-limits` · `bun run truth` · `bun run template-gate` · `bun run openapi:check` · `bun run e2e`

All gates are active. Deploy scripts (`deploy`, `deploy:staging`, `deploy:temp`) run `wrangler deploy` against the production/staging environments — see `adr/ADR-009.md` for the D1 `database_id` sentinel + CI secret injection mechanism.

## Next milestone

Hardening and additional vertical slices beyond the immunization tracker core.


