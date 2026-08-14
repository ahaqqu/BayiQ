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

The repository has a working immunization vertical slice: bilingual schedule, child/record local-first store with CRDT sync, D1-backed API, and BDD coverage. See `CONTEXT.md` for the current milestone.

## Available commands

| Command | Purpose |
|---|---|
| `bun install` | Install dependencies |
| `bun run check` | Typecheck |
| `bun run test` | Unit/property tests (coverage > 80%) |
| `bun run size-limit` | Bundle budget (< 200 KB gzipped JS) |
| `bun run agentic-limits` | Enforce file-size / import-count limits |
| `bun run truth` | Verify every dependency has an importer |
| `bun run e2e` | Playwright-BDD against `wrangler dev` |
| `bun run build` | Build web + prepare worker |
| `bun run dev` | Local worker + web |
| `bun run deploy` | Deploy production Worker to Cloudflare |
| `bun run deploy:staging` | Deploy staging Worker (`--env staging`) |
| `bun run template-gate` | Fail on drift from the upstream template |
| `bun run template-sync init` | Add the upstream template remote |
| `bun run template-sync seed` | Record sync state without merging |
| `bun run template-sync update` | Merge latest template updates |

## Deploy

Remote deploy requires a one-time provisioning step and GitHub secrets.

### One-time setup

1. **Set 2 GitHub secrets** (Settings → Secrets and variables → Actions):

   | Secret | Value |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | Cloudflare API token (D1:Edit, R2:Edit, Workers Scripts:Edit, Memberships:Read) |
   | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

2. **Run the "Provision Cloudflare resources" workflow** (Actions tab → "Provision Cloudflare resources" → Run workflow). This creates:
   - D1 databases (`DB`, `bayiq-db-staging`)
   - R2 buckets (`bayiq-bucket`, `bayiq-bucket-staging`)

   The workflow prints the D1 UUIDs and copy-pasteable `gh secret set` commands. Run those commands once (from a terminal with `gh auth login`) to set:

   | Secret | Value |
   |---|---|
   | `D1_DATABASE_ID` | UUID printed by the provision workflow |
   | `D1_DATABASE_ID_STAGING` | UUID printed by the provision workflow |

3. **Set 2 GitHub variables** (Settings → Secrets and variables → Actions → Variables tab):

   | Variable | Value |
   |---|---|
   | `PROD_URL` | Your production URL (e.g. `https://bayiq.<subdomain>.workers.dev`) |
   | `STAGING_URL` | Your staging URL (e.g. `https://bayiq-staging.<subdomain>.workers.dev`) |

After this, the deploy pipeline is fully automated. The provision workflow is idempotent — safe to re-run.

### How `database_id` is injected

`apps/api/wrangler.toml` ships a `replace-me-with-your-d1-uuid` sentinel — **not** a real UUID. Wrangler does not interpolate env vars in `wrangler.toml`, so `deploy:inject` substitutes the sentinel with the GitHub secret value before `wrangler deploy`. Local dev uses `preview_database_id` and is unaffected. See `adr/ADR-009.md` for the full rationale.

### Deploy commands

```bash
bun run deploy            # production (GitHub Actions: Deploy production workflow)
bun run deploy:staging    # staging (GitHub Actions: Staging workflow)
```

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
