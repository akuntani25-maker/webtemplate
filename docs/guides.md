# Panduan Penggunaan (How-To)

Panduan operasional untuk admin & developer.

## 1. Menambah Produk

### Via API (admin)
1. Login sebagai admin → dapatkan cookie auth.
2. `POST /api/v1/admin/products` dengan body:
```json
{
  "name": "Template Invoice Modern",
  "slug": "template-invoice-modern",
  "categoryId": "<uuid-kategori>",
  "description": "Deskripsi lengkap...",
  "shortDesc": "Ringkas...",
  "price": 120000,
  "discountPrice": 89000,
  "demoType": "PDF",
  "demoUrl": "https://...",
  "features": ["Auto total", "Multi mata uang"],
  "status": "DRAFT"
}
```
3. Set `status: "PUBLISHED"` saat siap tayang.

### Field penting
- `price`/`discountPrice`: **integer rupiah penuh** (89000 = Rp 89.000).
- `demoType`: `WEBSITE|SPREADSHEET|EXCEL|CANVA|NOTION|PDF|IMAGE|OTHER` —
  menentukan perilaku tombol **Live Demo**.
- `slug`: unik, huruf kecil, tanda hubung.

## 2. Upload File Produk (digital, privat)

File tidak boleh diakses publik. Alur upload aman:

1. Admin minta presigned URL:
   `POST /api/v1/admin/media/presign` → `{ url, key }` (PUT, berlaku singkat).
2. Klien `PUT` file langsung ke R2 memakai `url`.
3. Daftarkan file ke produk:
   `POST /api/v1/admin/products/:id/files`:
```json
{
  "label": "File utama",
  "storageKey": "<key dari presign>",
  "fileName": "invoice-modern-v1.zip",
  "format": "ZIP",
  "sizeBytes": 1048576,
  "version": "1.0.0"
}
```
> `storageKey` disimpan di DB — **bukan** URL publik. Download hanya lewat
> signed URL (10 menit, maks 5×) via `POST /downloads/:licenseId/files/:fileId/sign`.

## 3. Membuat Kategori

`POST /api/v1/admin/categories`:
```json
{ "name": "Template POS", "slug": "template-pos", "sortOrder": 5 }
```
Subkategori: sertakan `parentId`. Kategori nonaktif: `isActive: false`.

## 4. Membuat Blog

1. `POST /api/v1/admin/blog/posts`:
```json
{
  "title": "5 Template Excel untuk UMKM",
  "slug": "5-template-excel-umkm",
  "excerpt": "Ringkasan singkat...",
  "content": "<p>HTML dari rich text editor</p>",
  "categoryId": "<uuid opsional>",
  "metaTitle": "5 Template Excel UMKM Terbaik",
  "metaDescription": "...",
  "status": "DRAFT"
}
```
2. `content` disanitasi server-side (anti-XSS) sebelum disimpan.
3. Publikasikan: `status: "PUBLISHED"` → otomatis masuk sitemap & JSON-LD Article.

## 5. Verifikasi Pembayaran (admin)

1. User checkout → invoice `WAITING_PAYMENT`, lalu upload bukti transfer.
2. Admin buka daftar: `GET /api/v1/admin/payments?status=PENDING`.
3. Setujui: `POST /api/v1/admin/payments/:proofId/approve`
   → order `PAID`, License dibuat per item, email "download tersedia" terkirim.
4. Tolak: `POST /api/v1/admin/payments/:proofId/reject` + `rejectReason`.

## 6. Cara Melakukan Update (kode)

```bash
git checkout -b fitur/nama-fitur
# ubah kode...
npm run lint && npm run test && npm run build   # pastikan hijau
git commit -m "feat: ..." && git push
# buka Pull Request → CI berjalan → review → merge
```
Untuk perubahan schema DB, selalu sertakan migrasi Prisma (lihat `operations.md`).

## 7. Menambah Kupon

`POST /api/v1/admin/coupons`:
```json
{
  "code": "HEMAT20",
  "type": "PERCENT",
  "value": 20,
  "minPurchase": 100000,
  "maxDiscount": 50000,
  "expiresAt": "2026-12-31T23:59:59Z",
  "usageLimit": 100
}
```
Tipe `FIXED` → `value` sebagai nominal potongan (rupiah).
