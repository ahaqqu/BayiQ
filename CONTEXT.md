# CONTEXT

Mental model for agents working in BayiQ.

## What this is

BayiQ is a bilingual (Indonesian/English) child immunization tracker, bootstrapped from the `agentic-project-template`.

The original HTML/CSS/JS prototype has been archived under `prototype/` and will be migrated into a TypeScript/React Cloudflare stack in later tickets. The repository currently contains the project scaffold only — no running application.

## Layout

- `prototype/` — original HTML/CSS/JS prototype with IDAI 2024 schedule data and in-browser `localStorage` persistence.
- `apps/` — empty workspace awaiting the API and web applications.
- `packages/` — minimal shared packages (`contracts`, `infra`) needed by the template scripts; `local-first` to be rebuilt for immunization records.
- `docs/` — architecture, runbooks, and bootstrap guidance inherited from the template (see `docs/BOOTSTRAP_DEBT.md` for current suppressions).
- `.agents/skills/` — agent workflow skills inherited from the template.
- `.github/workflows/` — CI, vulnerability scan, and template-sync workflows inherited from the template.
- `scripts/` — agentic-limits, template-truth, OpenAPI check, and template-sync utilities inherited from the template.

## Gates

`bun run check` · `bun run test` · `bun run agentic-limits` · `bun run truth` · `bun run template-gate`

Application-specific gates (`build`, `size-limit`, `e2e`, `deploy`) are currently no-ops while the first vertical slice is being designed.

## Next milestone

Migrate the immunization schedule and child-record flows from `prototype/` into a local-first React PWA backed by a Hono API on Cloudflare Workers + D1.
