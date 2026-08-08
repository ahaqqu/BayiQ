# Bootstrap Debt

Daftar sementara (suppress) dan perbaikan yang harus dilakukan agar semua gate template hijau, plus utang teknis yang muncul karena project ini sedang dalam migrasi dari prototype ke aplikasi nyata.

> Lihat juga `docs/BOOTSTRAP_PROMPT.md` untuk checklist bootstrap resmi dari upstream template.

## Gate yang sudah hijau

| Gate | Perintah | Status |
|---|---|---|
| Typecheck | `bun run check` | ✅ |
| Unit/property tests | `bun run test` | ✅ |
| Agentic limits | `bun run agentic-limits` | ✅ |
| Template truth | `bun run truth` | ✅ |
| Template gate | `bun run template-gate` | ✅ |

Catatan: `template-gate` saat ini melaporkan "no sync state found; run update to seed state" dan keluar 0. Ini bukan suppress, melainkan karena belum pernah menjalankan `bun run template-sync update`. Setelah state tercatat, gate akan mulai memeriksa drift template-owned files.

## Suppress / no-op sementara

| Script | Suppress saat ini | Mengapa | Perbaikan nanti |
|---|---|---|---|
| `bun run dev` | `echo 'No application yet'` | Belum ada `apps/api` maupun `apps/web` | Ganti dengan build + wrangler dev setelah web/api dibuat. |
| `bun run build` | `echo 'No application yet'` | Belum ada aplikasi | Ganti dengan build web + prepare worker. |
| `bun run build:web` | `echo 'No application yet'` | Belum ada `apps/web` | Ganti dengan `bun run --filter @app/web build`. |
| `bun run size-limit` | `echo 'No application bundle yet'` | Belum ada bundle Vite | Aktifkan kembali setelah `apps/web` punya dist. |
| `bun run e2e` | `echo 'No E2E tests yet'` | Belum ada fitur BDD | Aktifkan setelah ada user-facing flow + webServer. |
| `bun run deploy` | `echo 'No application to deploy yet'` | Belum ada worker | Aktifkan setelah `apps/api` siap. |
| `bun run deploy:staging` | `echo 'No application to deploy yet'` | Belum ada worker | Aktifkan setelah `apps/api` siap. |
| `bun run deploy:temp` | `echo 'No application to deploy yet'` | Belum ada worker | Aktifkan setelah `apps/api` siap. |
| `bun run db:migrate:local` | `echo 'No database configured yet'` | Belum ada D1/migrations | Aktifkan setelah `apps/api` punya wrangler.toml + migrations. |
| `bun run openapi:check` | `echo 'No OpenAPI yet'` | Belum ada routes Hono | Aktifkan setelah `apps/api` punya route + OpenAPI. |
| `vitest --passWithNoTests` | Mengizinkan tidak ada test | Scaffold kosong, tests di `apps/` belum ada | Hapus `--passWithNoTests` setelah ada minimal test di `apps/**/src`. |

## Perubahan gate default yang disesuaikan

### `vitest.config.ts`

- Masih memakai include/exclude asli template (menargetkan `apps/**/src/**/*.test.ts`, `packages/**/src/**/*.test.ts`, `tests/scripts/**/*.test.mjs`).
- Karena `apps/` masih kosong, test suite saat ini hanya dari `packages/contracts` dan `packages/infra`.
- Coverage thresholds dimatikan secara implisit karena tidak ada perintah coverage. Nanti harus diaktifkan kembali dengan `vitest run --coverage` dan threshold 80% saat `apps/` sudah ada.

### `playwright.config.ts`

- Masih mengacu `http://127.0.0.1:8787` dan webServer wrangler. Saat ini E2E no-op. Nanti disesuaikan setelah API/web dibuat.

## Keputusan arsitektur yang sudah direkam

Keputusan berikut sudah disetujui dan direkam di `adr/`:

| ADR | Topik | Status |
|---|---|---|
| ADR-001 | Anonymous D1 sessions, defer real OAuth/email | accepted |
| ADR-002 | Static IDAI 2024 schedule with stable `doseId` | accepted |
| ADR-003 | Local-first CRDT sync to D1 for anonymous sessions | accepted |
| ADR-004 | Dense schedule table + optional list/card view | accepted |
| ADR-005 | Build-time JSON i18n files | accepted |

## Keputusan sengaja yang menyimpang dari template

1. **Hanya `packages/contracts` dan `packages/infra` yang dibuat sekarang**
   - Dibutuhkan agar `scripts/template-sync/cli.mjs` (yang mengimport logger dari infra dan template-sync contract) dapat berjalan.
   - `packages/local-first`, `apps/api`, `apps/web` dibiarkan kosong dan akan dibuat saat migrasi prototype.
   - `packages/contracts/src/index.ts` sengaja tidak mere-export `note`, `sync`, `auth` dari upstream karena sample Notes. Saat `template-sync` nanti merge `packages/contracts`, file ini akan konflik dan dipilih versi BayiQ (tambah BayiQ contracts, buang Notes).

2. **`tests/` hanya berupa direktori kosong**
   - Dibutuhkan agar `scripts/check-template-truth.mjs` tidak error saat menscan `tests/`.
   - `tests/scripts/template-sync.test.mjs` belum dicopy karena test tersebut mengasumsikan repo fork nyata dengan upstream; akan ditambahkan saat setup template-sync state selesai, atau diadaptasi untuk scaffold kosong.
   - Nanti diisi dengan `tests/features/*.feature` dan `tests/steps/*.ts` saat fitur BDD pertama dibuat.

## Utang teknis domain

| Area | Catatan | Milestone target |
|---|---|---|
| Domain model | `docs/GLOSSARY.md` dan ADRs sudah dibuat | grill-with-docs ✅ |
| Contracts | Schema Valibot untuk domain imunisasi — akan dibuat saat implementasi | to-spec / guided-implementation |
| Local-first | Mekanisme sync untuk catatan imunisasi, bukan Notes | packages/local-first rebuild |
| DB schema | Migrations D1 untuk session, child, record snapshots | guided-implementation |
| UI/UX | Migrasi tabel IDAI 2024 ke React + Tailwind + table/list toggle | guided-implementation |
| i18n | Salin + perbaiki strings `id`/`en` dari `prototype/js/data.js` ke JSON | guided-implementation |
| Auth | Anonymous session saat ini, bisa diganti Better Auth nanti | P1 |
| Tests | BDD untuk flow "tambah anak → lihat jadwal → catat dosis" | writing-tests |

## Cara mengecek utang ini

```bash
bun run check
bun run test
bun run agentic-limits
bun run truth
bun run template-gate
```

Jika ada suppress yang belum dihilangkan, gate akan tetap hijau tapi menampilkan pesan placeholder. PR harus mencatat suppress yang masih aktif.
