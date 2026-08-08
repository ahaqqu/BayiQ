# BayiQ

BayiQ is a bilingual (Indonesian/English) child immunization tracker, bootstrapped from the `agentic-project-template`.

The original HTML/CSS/JS prototype is preserved in `prototype/` and will be migrated into a Cloudflare-based TypeScript/React stack.

## Docs

- [`AGENTS.md`](AGENTS.md) — guardrails and workflow skills for AI agents.
- [`CONTEXT.md`](CONTEXT.md) — current state and next milestone.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architectural principles.
- [`docs/BOOTSTRAP_PROMPT.md`](docs/BOOTSTRAP_PROMPT.md) — how to complete the bootstrap.
- [`docs/BOOTSTRAP_DEBT.md`](docs/BOOTSTRAP_DEBT.md) — temporary suppressions and known debt from this bootstrap.

## Current status

The repository is bootstrapped but contains **no running application** yet. The `apps/` and `packages/` workspaces are empty placeholders.

## Available commands

| Command | Purpose |
|---|---|
| `bun install` | Install dependencies |
| `bun run check` | Typecheck |
| `bun run test` | Unit/property tests (currently no tests) |
| `bun run agentic-limits` | Enforce file-size / import-count limits |
| `bun run truth` | Verify every dependency has an importer |
| `bun run template-gate` | Fail on drift from the upstream template |
| `bun run template-sync init` | Add the upstream template remote |
| `bun run template-sync update` | Merge latest template updates |

Application commands (`dev`, `build`, `e2e`, `deploy`) currently print a placeholder message while the first vertical slice is being designed.

## Prototype

The original prototype lives in `prototype/`:

```bash
cd prototype
python3 -m http.server 8000
# open http://localhost:8000
```

## Roadmap

1. Apply the `grill-with-docs` skill to sharpen domain terminology and produce ADRs.
2. Use `to-spec` and `to-tickets` to plan the first immunization vertical slice.
3. Migrate the schedule data and child-record flows into `packages/contracts`, `packages/local-first`, `apps/api`, and `apps/web`.
