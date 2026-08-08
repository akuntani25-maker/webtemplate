# Tahap 15 — Deployment

Topologi: **Vercel** (web) · **Railway** (api) · **Supabase** (Postgres) ·
**Cloudflare R2** (storage) · **Cloudflare DNS/SSL** (domain).

## 1. Database — Supabase

1. Buat project di Supabase → salin **connection string** (mode `session`/pooler).
2. Set `DATABASE_URL` di Railway (api).
   - Untuk migrasi gunakan koneksi langsung (port 5432); untuk runtime bisa pakai pooler (port 6543) + `?pgbouncer=true&connection_limit=1`.
3. Terapkan migrasi: `npm --workspace @digitemplate/api run prisma:deploy`.

## 2. Storage — Cloudflare R2

1. Buat bucket (mis. `digitemplate`), **privat**.
2. Buat R2 API Token (Access Key ID + Secret).
3. Isi env api: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
   lalu set `STORAGE_DRIVER=r2` agar API **gagal cepat** bila kredensial kurang
   (mencegah diam-diam jatuh ke penyimpanan lokal).
4. File produk & bukti transfer di-upload privat; akses hanya via signed URL.

> Untuk pengembangan lokal, biarkan `R2_*` kosong: API otomatis memakai disk
> lokal (`apps/api/.storage`) dengan signed URL berumur pendek. Lihat
> `docs/troubleshooting.md` §2.

## 3. Backend — Railway

1. New Project → Deploy from GitHub → pilih repo.
2. **Root directory**: `apps/api` (atau gunakan Dockerfile `apps/api/Dockerfile`).
3. Build: `npm install && npm run build` · Start: `npm run start:prod`
   (Dockerfile sudah menjalankan `prisma migrate deploy` lalu `node dist/main.js`).
4. Set environment variables (lihat `apps/api/.env.example`), khususnya:
   - `NODE_ENV=production`, `COOKIE_SECURE=true`, `COOKIE_DOMAIN=.domainanda.com`
   - `WEB_ORIGIN=https://domainanda.com`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (≥ 32 char, acak).
5. Catat URL publik API (mis. `https://api.domainanda.com`).

## 4. Frontend — Vercel

1. Import repo → framework **Next.js**.
2. **Root directory**: `apps/web`.
3. Environment:
   - `NEXT_PUBLIC_API_URL=https://api.domainanda.com/api/v1`
   - `NEXT_PUBLIC_SITE_URL=https://domainanda.com`
4. Deploy. Vercel menangani ISR, image optimization, dan edge caching.

## 5. Domain & SSL — Cloudflare

1. Tambah domain ke Cloudflare, arahkan nameserver.
2. Record:
   - `@` / `www` → Vercel (CNAME sesuai instruksi Vercel).
   - `api` → Railway (CNAME domain Railway).
3. SSL/TLS mode **Full (strict)**. HTTPS otomatis.
4. Pastikan `COOKIE_DOMAIN` mencakup subdomain agar cookie auth berfungsi lintas web↔api (gunakan domain induk, mis. `.domainanda.com`).

## 6. Cookie lintas domain (penting)

Karena web dan api beda subdomain, agar cookie HttpOnly terkirim:

- `COOKIE_SECURE=true`, `SameSite` tetap `Strict` bila web & api satu domain induk;
  bila benar-benar cross-site, pertimbangkan `SameSite=None; Secure` dan CORS `credentials`.
- CORS `WEB_ORIGIN` harus sama persis dengan origin frontend.

## 7. Checklist Produksi

- [ ] Secret JWT diganti (acak, ≥ 32 char).
- [ ] `COOKIE_SECURE=true`, domain benar.
- [ ] Admin default diganti password / dinonaktifkan.
- [ ] **`STORAGE_DRIVER=r2`** + `R2_*` terisi (jangan biarkan driver lokal aktif
      di produksi — file tidak persisten & tidak terbagi antar instance).
- [ ] `PUBLIC_API_URL` menunjuk URL API produksi.
- [ ] Rate limit sesuai trafik.
- [ ] Backup database terjadwal (lihat `operations.md`).
- [ ] Monitoring/health check aktif (`/health/ready`).
- [ ] R2 bucket privat, tidak ada akses publik langsung.

## 8. CI/CD

`/.github/workflows/ci.yml` menjalankan lint, test, dan build untuk api & web
pada setiap push/PR. Deploy dipicu otomatis oleh Vercel & Railway dari branch
`main` (atau sesuai konfigurasi platform).
