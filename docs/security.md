# Keamanan

Ringkasan kontrol keamanan yang diterapkan dan cara kerjanya di kode.

## Autentikasi

- **Argon2id** untuk hashing password (memory-hard, parameter sesuai OWASP:
  `memoryCost=19456, timeCost=2, parallelism=1`). Lihat `auth.service.ts`.
- **Login timing**: verifikasi dummy saat email tak ditemukan untuk mengurangi
  user enumeration lewat perbedaan waktu.
- **JWT**: access token pendek (15 menit) + refresh token (7 hari).
- **Refresh rotation + reuse detection** (`token.service.ts`):
  - Refresh token disimpan sebagai **hash SHA-256**, bukan mentah.
  - Setiap token punya `family`. Rotasi menandai token lama `revoked` + `replacedBy`.
  - Pemakaian ulang token yang sudah dirotasi → **seluruh family dicabut**
    (indikasi pencurian). Diuji di `token.service.spec.ts`.
- **Cookie**: `HttpOnly`, `Secure` (produksi), `SameSite=Strict`, path/domain terbatas.

## Otorisasi

- `JwtAuthGuard` global memverifikasi token; route publik ditandai `@Public()`.
- `RolesGuard` + `@Roles('ADMIN')` untuk endpoint admin.
- **Ownership check**: mis. download memverifikasi `license.userId === user`.

## Perlindungan Web

| Ancaman | Kontrol |
|---------|---------|
| Header/serangan umum | **Helmet** (`main.ts`) |
| CORS | Allowlist origin + `credentials` (env `WEB_ORIGIN`) |
| Brute force / abuse | **Throttler** global + limit ketat di `/auth/*` & `/downloads/*/sign` |
| Input jahat | `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) + `class-validator` |
| XSS (blog) | Sanitasi HTML (`sanitize-html`) sebelum simpan konten rich text |
| SQL Injection | Prisma query terparametrisasi (tanpa string concat) |
| Kebocoran error | `AllExceptionsFilter` menyembunyikan detail 5xx di produksi |
| Enumerasi ID | **UUID** untuk semua PK |

## Data & File

- File digital & bukti transfer **privat** di R2; akses hanya via **signed URL**
  berumur pendek (10 menit) dengan **kuota 5×** per lisensi.
- `storageKey` disimpan di DB, bukan URL publik.
- **Soft delete** (`deletedAt`) — data inti tidak hilang permanen.

## Audit

- `AuditService` mencatat aksi sensitif: `AUTH_LOGIN`, `AUTH_LOGIN_FAILED`,
  `AUTH_REFRESH_REUSE`, `AUTH_PASSWORD_CHANGED`, `DOWNLOAD`, verifikasi bayar, dll.
- Kegagalan audit tidak menggagalkan request (best-effort).

## Rekomendasi Lanjutan

- Verifikasi email & 2FA untuk admin.
- WAF/Bot management di Cloudflare.
- Rotasi secret berkala (lihat `operations.md`).
- CSP ketat di produksi (Helmet CSP aktif; sesuaikan sumber).
- Secret scanning & dependency audit di CI (`npm audit`, Dependabot).
