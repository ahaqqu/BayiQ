# Bootstrap Debt

Daftar sementara (suppress) dan perbaikan yang harus dilakukan agar semua gate template hijau, plus utang teknis yang muncul karena project ini sedang dalam migrasi dari prototype ke aplikasi nyata.

> Lihat juga `docs/BOOTSTRAP_PROMPT.md` untuk checklist bootstrap resmi dari upstream template.

## Gate yang sudah hijau

| Gate | Perintah | Status |
|---|---|---|
| Typecheck | `bun run check` | ✅ |
| Unit/property tests | `bun run test` (coverage > 80%) | ✅ |
| Bundle budget | `bun run size-limit` (< 200 KB gz) | ✅ |
| Agentic limits | `bun run agentic-limits` | ✅ |
| Template truth | `bun run truth` | ✅ |
| Template gate | `bun run template-gate` | ✅ |
| OpenAPI sync | `bun run openapi:check` | ✅ |
| E2E/BDD | `bun run e2e` | ✅ |

Catatan: `template-gate` saat ini melaporkan "no sync state found; run update to seed state" dan keluar 0. Ini bukan suppress, melainkan karena belum pernah menjalankan `bun run template-sync update`. Setelah state tercatat, gate akan mulai memeriksa drift template-owned files.

## Suppress / no-op sementara

| Script | Suppress saat ini | Mengapa | Perbaikan nanti |
|---|---|---|---|
| `bun run deploy` | `echo 'No application to deploy yet'` | Belum ada worker yang di-deploy | Aktifkan setelah staging deploy pipeline siap (next slice). |
| `bun run deploy:staging` | `echo 'No application to deploy yet'` | Belum ada worker yang di-deploy | Aktifkan setelah staging deploy pipeline siap (next slice). |
| `bun run deploy:temp` | `echo 'No application to deploy yet'` | Belum ada worker yang di-deploy | Aktifkan setelah staging deploy pipeline siap (next slice). |

## Perubahan gate default yang disesuaikan

### `vitest.config.ts`

- Coverage aktif dengan threshold 80% lines/functions/statements dan 70% branches, sesuai DoD.
- `apps/web/src/components/**` dan `main.tsx` dikecualikan dari coverage unit (UI di-cover oleh Playwright-BDD + axe), konsisten dengan template.
- `**/client.ts` (barrel) dan `apps/api/src/cf-types.ts` (type-only) dikecualikan.

### `playwright.config.ts`

- webServer menjalankan `bun run build` + `wrangler d1 migrations apply bayiq-db --local` + `wrangler dev` di `127.0.0.1:8787`.
- BDD feature: `tests/features/record-first-dose.feature` — flow "continue → tambah anak → catat dosis → sel selesai → badge 17".

## Keputusan arsitektur yang sudah direkam

Keputusan berikut sudah disetujui dan direkam di `adr/`:

| ADR | Topik | Status |
|---|---|---|
| ADR-001 | Anonymous D1 sessions, defer real OAuth/email | accepted |
| ADR-002 | Static IDAI 2024 schedule with stable `doseId` | accepted |
| ADR-003 | Local-first CRDT sync to D1 for anonymous sessions | accepted |
| ADR-004 | Dense schedule table + optional list/card view | accepted |
| ADR-005 | Build-time JSON i18n files | accepted |
| ADR-006 | Session lifecycle: create-only, 1-year expiry, hashed token | accepted |
| ADR-007 | Sync envelope, deletion cascade, record uniqueness | accepted |
| ADR-008 | Schedule data placement: dose map in contracts, full schedule in web | accepted |

## Keputusan sengaja yang menyimpang dari template

1. **`packages/contracts` tidak mere-export `note`, `sync`, `auth` dari upstream** — sample Notes dibuang; BayiQ punya `session`, `child`, `record`, `sync`, dan `schedule` (dose map). Saat `template-sync` nanti merge `packages/contracts`, file ini akan konflik dan dipilih versi BayiQ.
2. **`packages/local-first` di-rebuild untuk Child/Record** — SCHEMA_VERSION 3, migrasi v2 (notes) → v3 (kosong) karena BayiQ belum pernah ship notes ke user nyata.
3. **`tests/` berisi feature BDD** — `tests/features/record-first-dose.feature` + `tests/steps/record-first-dose.steps.ts`, dijalankan via `bun run e2e`.

## Utang teknis domain

| Area | Catatan | Milestone target |
|---|---|---|
| Domain model | `docs/GLOSSARY.md` dan ADRs sudah dibuat | grill-with-docs ✅ |
| Contracts | Schema Valibot untuk session/child/record/sync + dose map | vertical slice ✅ |
| Local-first | Store Child/Record + LWW merge + tombstones + leader + sync loop | vertical slice ✅ |
| DB schema | Migrations D1 untuk sessions + sync_snapshots | vertical slice ✅ |
| UI/UX | Tabel IDAI 2024 + list view + modal dosis + notifikasi + onboarding | vertical slice ✅ |
| i18n | JSON `id`/`en` di `apps/web/public/locales` | vertical slice ✅ |
| Auth | Anonymous session saat ini, bisa diganti Better Auth nanti | P1 |
| Tests | BDD flow "tambah anak → lihat jadwal → catat dosis" | vertical slice ✅ |
| Deploy | `deploy`/`deploy:staging`/`deploy:temp` masih no-op | next slice |

## Cara mengecek utang ini

```bash
bun run check
bun run test
bun run size-limit
bun run agentic-limits
bun run truth
bun run template-gate
bun run openapi:check
bun run e2e
```

Jika ada suppress yang belum dihilangkan, gate akan tetap hijau tapi menampilkan pesan placeholder. PR harus mencatat suppress yang masih aktif.
