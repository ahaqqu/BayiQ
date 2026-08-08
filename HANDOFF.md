# Handoff

## What this branch contains

This branch lands the planning artifacts for the BayiQ first vertical slice:

- `docs/GLOSSARY.md` — canonical domain terms (Account, Child, Dose, DoseId, Record, Schedule, Session, Status, Vaccine).
- `adr/ADR-001.md` through `adr/ADR-005.md` — accepted architecture decisions:
  - anonymous D1 sessions, defer real OAuth/email
  - static IDAI 2024 schedule with stable `doseId`
  - local-first CRDT sync to D1
  - dense schedule table + optional list/card view
  - build-time JSON i18n files
- `docs/BOOTSTRAP_DEBT.md` — updated to mark the domain-model milestone resolved and link to the ADRs.
- `.scratch/specs/vertical-slice-immunization.md` — full spec for the first vertical slice.
- `.scratch/vertical-slice-immunization/issues/01–09.md` — local ticket files with GitHub issue links.

## GitHub issues created

- Parent spec: https://github.com/ahaqqu/BayiQ/issues/4
- Tickets (label `ready-for-agent`):
  - #5 — 01: Prefactor package seams
  - #6 — 02: Immunization contracts
  - #7 — 03: Local-first store
  - #8 — 04: API session + sync
  - #9 — 05: End-to-end sync
  - #10 — 06: Web shell + onboarding
  - #11 — 07: Schedule table + dose modal
  - #12 — 08: Notifications + view toggle
  - #13 — 09: BDD first flow

## Next session prompt

Continue BayiQ vertical slice implementation — start ticket #5.

Context:
- Repository: `ahaqqu/BayiQ`
- Approved spec: GitHub issue #4
- Ticket to start: GitHub issue #5 — `01 — Prefactor package seams`
- All tickets (#5–#13) are created and labeled `ready-for-agent`
- Domain glossary: `docs/GLOSSARY.md`
- ADRs: `adr/ADR-001.md` through `adr/ADR-005.md`
- Full spec: `.scratch/specs/vertical-slice-immunization.md`
- Local tickets: `.scratch/vertical-slice-immunization/issues/01–09.md`

Do:
1. Read the spec, ticket #5, and the ADRs/glossary.
2. Implement ticket #5 — prefactor package seams.
3. Ensure `bun run check`, `bun run test`, `bun run agentic-limits`, `bun run truth`, and `bun run template-gate` still pass.
4. Update the ticket checklist as acceptance criteria are met.

Constraints:
- Follow `AGENTS.md` and `docs/ARCHITECTURE.md`.
- Files ≤300 lines, ≤5 direct dependencies.
- No hardcoded user-facing strings; externalize in `id` and `en`.
- No `env.*` direct access — use adapters in `packages/infra`.
- Do not run `git commit`/`push`/`rebase` without explicit confirmation.
