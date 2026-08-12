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

## Known security and infrastructure trade-offs

The following are documented, intentional trade-offs for the free-tier anonymous-session architecture:

1. **Sentry DSN is public by design** (ADR-006): the web DSN (`VITE_SENTRY_DSN`) is baked into the JS bundle at build time, and the worker DSN (`SENTRY_DSN`) wraps every request. Sentry DSNs are not secrets — they are public identifiers. Both are unset by default (commented out in `.env.example`), so Sentry is fully disabled until explicitly configured. `tracesSampleRate: 0` ensures errors-only, no performance overhead. This trade-off is accepted rather than loading the DSN at runtime, which would add a network round-trip before error capture works.

2. **CORS allowlist**: production and staging `ALLOWED_ORIGINS` in `wrangler.toml` default to empty. Real deploy origins must be overridden via `wrangler secret` or environment vars at deploy time.

3. **Bearer token in `localStorage`**: the anonymous session token is stored in `localStorage` (not `httpOnly` cookies) because the local-first architecture requires offline read access to the token for sync. A restrictive CSP mitigates XSS exfiltration. When real auth arrives (ADR-006 upgrade path), the token should move to an `httpOnly` cookie.

4. **No schema-level FK / CASCADE**: `sync_snapshots` has no foreign key to `sessions`. The application enforces cascade deletes in `cleanupExpiredSessions`. A schema migration adding `REFERENCES sessions(id) ON DELETE CASCADE` is a future hardening step.
