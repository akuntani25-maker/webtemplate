# Tahap 1 & 2 — Database Design

## Prinsip

- **UUID** (`@default(uuid())`) untuk semua PK — aman dari enumerasi.
- **Timestamp**: `createdAt @default(now())`, `updatedAt @updatedAt`.
- **Soft delete**: `deletedAt DateTime?` pada entitas inti; query default memfilter `deletedAt = null` (lewat Prisma extension / middleware).
- **Uang** disimpan sebagai **integer** dalam satuan terkecil (rupiah penuh, tanpa desimal) untuk menghindari galat floating point.
- **Enum** untuk status agar konsisten & terindeks.
- **Index** pada kolom yang sering difilter/di-sort (`slug`, `status`, `categoryId`, `createdAt`, `ratingAvg`, dst).

## Ringkasan Tabel

| Tabel | Fungsi |
|-------|--------|
| `User`, `RefreshToken`, `Address` | Identitas & sesi. |
| `Category` | Kategori & subkategori (self relation). |
| `Product`, `ProductImage`, `ProductFile`, `ProductFaq`, `ProductChangelog`, `Tag` | Katalog. |
| `Order`, `OrderItem`, `Invoice`, `PaymentProof`, `License` | Transaksi & lisensi. |
| `Coupon` | Diskon. |
| `Review` | Ulasan produk. |
| `WishlistItem` | Favorit. |
| `DownloadLog` | Audit download & kuota. |
| `BlogPost`, `BlogCategory`, `BlogTag`, `BlogComment` | Blog. |
| `Banner`, `Testimonial`, `Faq`, `SiteSetting` | Konten & konfigurasi. |
| `AuditLog` | Jejak aksi sensitif. |

## Enum

| Enum | Nilai |
|------|-------|
| `Role` | `USER`, `ADMIN` |
| `ProductStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `DemoType` | `WEBSITE`, `SPREADSHEET`, `EXCEL`, `CANVA`, `NOTION`, `PDF`, `IMAGE`, `OTHER` |
| `OrderStatus` | `PENDING`, `WAITING_PAYMENT`, `PAID`, `CANCELLED`, `EXPIRED`, `REFUNDED` |
| `InvoiceStatus` | `WAITING_PAYMENT`, `PAID`, `EXPIRED`, `CANCELLED` |
| `PaymentMethod` | `MANUAL_TRANSFER`, `QRIS`, `GOPAY`, `OVO`, `DANA`, `SHOPEEPAY`, `BANK_TRANSFER` |
| `PaymentProofStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `CouponType` | `PERCENT`, `FIXED` |
| `ReviewStatus` | `PENDING`, `PUBLISHED`, `REJECTED` |
| `PostStatus` | `DRAFT`, `PUBLISHED` |
| `CommentStatus` | `PENDING`, `APPROVED`, `SPAM` |

## Strategi Index (contoh)

- `Product`: `@@index([status, categoryId])`, `@@index([createdAt])`, `@@index([ratingAvg])`, `@@index([purchaseCount])`, unique `slug`.
- `Order`: `@@index([userId, status])`, unique `number`.
- `License`: `@@index([userId, productId])`, `@@unique([orderItemId])`.
- `BlogPost`: unique `slug`, `@@index([status, publishedAt])`.

## Migrasi

Gunakan Prisma Migrate (`prisma migrate dev` untuk lokal, `prisma migrate deploy` untuk produksi). Lihat `docs/operations.md`.

## Soft Delete

Diterapkan via **Prisma Client Extension** (`apps/api/src/database/soft-delete.extension.ts`) yang:
1. Mengubah `delete`/`deleteMany` menjadi update `deletedAt = now()`.
2. Menyisipkan filter `deletedAt: null` pada `find*`/`count` (kecuali query eksplisit menyertakan `deletedAt`).
