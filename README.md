# DigiTemplate Marketplace

Marketplace **produk digital** (template website, spreadsheet, Excel, Notion,
Canva, PDF, invoice, dashboard, admin, bisnis, UMKM, keuangan, dll). Dibangun
dengan arsitektur bersih, aman, cepat, dan siap dikembangkan menjadi
marketplace berskala besar.

> Dokumen ini adalah titik masuk. Detail bertahap ada di folder [`docs/`](./docs).

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js (App Router) · React · TypeScript · TailwindCSS · Shadcn-style UI · Framer Motion · React Hook Form · Zod · TanStack Query · Axios |
| Backend | NestJS · TypeScript · Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + Refresh Token (rotasi & reuse detection) · HttpOnly Cookie · Argon2id |
| Storage | Cloudflare R2 (S3-compatible, privat, signed URL) |
| Deploy | Vercel (web) · Railway (api) · Supabase (db) · Cloudflare (DNS/SSL) |
| CI/CD | GitHub Actions |

## Struktur Monorepo

```
apps/
  api/   → NestJS backend
  web/   → Next.js frontend
docs/    → dokumentasi Tahap 1–15
```

Lihat [`docs/07-folder-structure.md`](./docs/07-folder-structure.md) untuk rincian.

## Status Implementasi (per tahap)

| Tahap | Cakupan | Status |
|-------|---------|--------|
| 1 | Analisis, arsitektur, flowchart, ERD, DB design | ✅ Dokumen lengkap |
| 2 | Struktur folder, Prisma schema, API design | ✅ Schema & desain lengkap |
| 3 | Authentication (Argon2, JWT rotation, cookie) | ✅ Terimplementasi + test |
| 4 | Admin Panel | 🚧 Endpoint & modul terstruktur (buildout lanjutan) |
| 5 | Frontend user (home, produk, SEO) | ✅ Scaffold berjalan (build hijau) |
| 6 | Checkout | 🚧 Skema & alur siap (service buildout) |
| 7 | Upload bukti transfer | 🚧 Skema & storage siap |
| 8 | Verifikasi admin | 🚧 Alur & audit siap |
| 9 | Download digital (signed URL + kuota) | ✅ Terimplementasi |
| 10 | Blog | 🚧 Skema lengkap |
| 11 | SEO (meta, JSON-LD, sitemap, robots) | ✅ Terimplementasi |
| 12 | Testing | ✅ Unit test auth + pola test |
| 13 | Docker | ✅ Dockerfile + compose |
| 14 | CI/CD | ✅ GitHub Actions |
| 15 | Deployment | ✅ Panduan lengkap |

✅ = berjalan/terverifikasi · 🚧 = fondasi (schema, kontrak API, modul) tersedia,
logika bisnis lanjutan mengikuti pola yang sudah ada.

Backend **build + lint + test hijau**; frontend **typecheck + build hijau**.

## Menjalankan Secara Lokal

### Prasyarat
- Node.js ≥ 20, npm ≥ 10
- PostgreSQL 16 (atau `docker compose up -d db`)

### 1. Install
```bash
npm install            # workspaces: api + web sekaligus
```

### 2. Konfigurasi environment
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Isi DATABASE_URL, JWT secrets, R2, dll.
```

### 3. Database
```bash
npm run prisma:generate
npm run prisma:migrate         # buat & terapkan migrasi
npm run prisma:seed            # data awal (admin, kategori, contoh produk)
```
Admin default: `admin@digitemplate.id` / `Admin#12345` (ganti di produksi).

### 4. Jalankan
```bash
npm run dev                    # api (4000) + web (3000) paralel
```
- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Health: http://localhost:4000/api/v1/health/ready

### Dengan Docker
```bash
docker compose up -d           # db + api + web
```

## Skrip Penting (root)

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan api + web (dev) |
| `npm run build` | Build keduanya |
| `npm run lint` | Lint keduanya |
| `npm run test` | Unit test API |
| `npm run prisma:migrate` | Migrasi Prisma |
| `npm run prisma:seed` | Seed database |

## Dokumentasi

- Tahap 1–2: [`01`](./docs/01-requirements-analysis.md) · [`02`](./docs/02-architecture.md) · [`03`](./docs/03-flowchart.md) · [`04`](./docs/04-erd.md) · [`05`](./docs/05-database-design.md) · [`06`](./docs/06-api-design.md) · [`07`](./docs/07-folder-structure.md)
- Operasional: [`deployment`](./docs/deployment.md) · [`operations`](./docs/operations.md) (backup/restore/migrasi) · [`guides`](./docs/guides.md) (tambah produk, upload file, kategori, blog)
- Keamanan: [`security`](./docs/security.md)

## Keamanan (ringkas)

Helmet · CORS allowlist · Rate limiting (Throttler) · validasi + sanitasi input
global · Argon2id · JWT rotation + reuse detection · HttpOnly/Secure/SameSite
cookie · signed URL privat berumur pendek · audit log · Prisma parameterized
(anti-SQLi). Detail: [`docs/security.md`](./docs/security.md).

## Lisensi

Proprietary — internal project.
