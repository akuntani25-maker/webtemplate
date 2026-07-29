# Tahap 1 — Arsitektur Sistem

## 1. Gambaran Umum

Arsitektur **decoupled monorepo**: frontend (Next.js) dan backend (NestJS) terpisah,
berkomunikasi via REST/JSON. Object storage (Cloudflare R2) menyimpan file digital
secara privat; akses hanya lewat signed URL.

```mermaid
flowchart LR
  subgraph Client
    Browser["Browser / Mobile Web"]
  end

  subgraph Edge["Vercel Edge / CDN"]
    Next["Next.js App Router\n(SSR / ISR / RSC)"]
  end

  subgraph Backend["Railway"]
    API["NestJS REST API\n(Modular, JWT, Prisma)"]
    Worker["Scheduled Jobs\n(invoice expiry, email)"]
  end

  DB[("Supabase\nPostgreSQL")]
  R2[("Cloudflare R2\nPrivate Object Storage")]
  Mail["Email Provider\n(Resend / SMTP)"]

  Browser -->|HTTPS| Next
  Next -->|REST + HttpOnly cookie| API
  Browser -.->|Signed URL GET| R2
  API --> DB
  API --> R2
  API --> Mail
  Worker --> DB
  Worker --> Mail
  API -.->|SSR data fetch| Next
```

## 2. Pemisahan Lapisan (Clean Architecture pada API)

Setiap modul NestJS mengikuti pembagian tanggung jawab:

```
Controller  → HTTP boundary (validasi DTO via Zod/class-validator, auth guard)
Service     → Use-case / business rule (BR-*)
Repository  → Akses data via Prisma (satu-satunya yang menyentuh DB)
Domain      → Entity/type & aturan invarian
```

Prinsip:
- **Dependency rule**: lapisan dalam tidak tahu lapisan luar.
- **Repository pattern** membungkus Prisma agar mudah di-mock saat test & ditukar.
- **DTO** memisahkan bentuk API dari bentuk DB.

## 3. Modul Backend (NestJS)

| Modul | Tanggung jawab |
|-------|----------------|
| `AuthModule` | Register, login, refresh, logout, Argon2, JWT rotation. |
| `UsersModule` | Profil, ganti password, role. |
| `CatalogModule` | Products, Categories, Tags, Reviews. |
| `MediaModule` | Upload thumbnail/gallery, generate signed URL (R2). |
| `CartOrderModule` | Cart, Order, Invoice, License. |
| `PaymentModule` | PaymentProof, verifikasi admin, provider adapter. |
| `CouponModule` | Validasi & penerapan kupon. |
| `DownloadModule` | Otorisasi & pembuatan signed URL berbatas waktu/kuota. |
| `WishlistModule` | Simpan produk favorit. |
| `BlogModule` | Post, kategori, tag, komentar. |
| `ContentModule` | Banner, Testimonial, FAQ, SiteSetting, SEO meta. |
| `AdminModule` | Agregasi dashboard & statistik. |
| `NotificationModule` | Email + event. |
| `AuditModule` | Audit log lintas aksi sensitif. |
| `HealthModule` | Liveness/readiness. |

## 4. Aliran Pembayaran (Provider-Agnostic)

```mermaid
flowchart TD
  Checkout --> CreateInvoice[Buat Invoice WAITING_PAYMENT]
  CreateInvoice --> Method{Metode}
  Method -->|Manual Transfer| ManualFlow[User upload bukti → Admin verifikasi]
  Method -->|Gateway QRIS/E-wallet| GatewayFlow[Redirect/QR → Callback webhook]
  ManualFlow --> Paid[Status PAID + buat License]
  GatewayFlow --> Paid
  Paid --> Download[Aktifkan Download signed URL]
```

`PaymentProvider` adalah interface. Fase 1 memakai `ManualTransferProvider`.
Fase berikut cukup menambah `MidtransProvider` / `XenditProvider` tanpa mengubah
`CartOrderModule`.

## 5. Keamanan (ringkas — detail di `docs/security` & kode)

- **Transport**: HTTPS everywhere, HSTS.
- **AuthN**: Argon2id hash, access token (JWT, 15 menit) + refresh token (7 hari, HttpOnly, Secure, SameSite=Strict), rotasi + reuse detection.
- **AuthZ**: Role guard (`USER`/`ADMIN`), ownership check.
- **Web**: Helmet, CORS allowlist, rate limiting (Throttler), CSRF token untuk mutasi cookie-based, input validation + sanitization, output encoding.
- **Data**: Prisma parameterized queries (anti SQLi), signed URL privat, audit log.

## 6. Performa & Caching

| Teknik | Lokasi |
|--------|--------|
| SSR + ISR (revalidate) | Halaman produk & blog (Next.js) |
| RSC + streaming | Home & listing |
| HTTP cache / CDN | Vercel edge |
| Query caching | TanStack Query (client), Cache-Control (API) |
| Image optimization | `next/image`, format modern |
| Code splitting & lazy | Dynamic import komponen berat |
| DB index | Kolom filter/sort (lihat schema) |

## 7. Observability

- Structured logging (pino) + request id.
- Health endpoints (`/health/live`, `/health/ready`).
- Audit log tabel untuk aksi sensitif (login gagal, verifikasi bayar, download).
- Error tracking siap (Sentry DSN via env, opsional).

## 8. Deployment Topologi

```mermaid
flowchart LR
  GH[GitHub] -->|Actions CI| Build
  Build -->|deploy| Vercel[(Vercel — web)]
  Build -->|deploy| Railway[(Railway — api)]
  Railway --> Supabase[(Supabase Postgres)]
  Railway --> R2[(Cloudflare R2)]
  Cloudflare[Cloudflare DNS/SSL] --> Vercel
  Cloudflare --> Railway
```
