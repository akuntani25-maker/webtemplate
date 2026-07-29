# Tahap 1 — Analisis Kebutuhan

> Dokumen ini menjadi acuan tunggal (single source of truth) untuk lingkup produk
> **DigiTemplate Marketplace** — marketplace produk digital (template).

## 1. Ringkasan Produk

DigiTemplate adalah marketplace penjualan **produk digital** berupa template:
Website, Google Spreadsheet, Excel, Notion, Canva, PDF, Invoice, Dashboard,
Admin, Bisnis, UMKM, Keuangan, POS, HR, dan lainnya.

Karakteristik utama produk digital:

- Tidak ada pengiriman fisik.
- File harus terlindungi (tidak boleh diakses via URL publik).
- Pengiriman = akses **download aman (signed URL)** setelah pembayaran terverifikasi.
- Bisa memiliki **Live Demo / Preview** sesuai format.

## 2. Aktor Sistem

| Aktor | Deskripsi |
|-------|-----------|
| **Guest** | Pengunjung tanpa login. Bisa melihat produk, blog, demo, mencari. |
| **User** | Terdaftar. Bisa checkout, upload bukti transfer, download, review, wishlist. |
| **Admin** | Mengelola katalog, order, verifikasi pembayaran, blog, SEO, setting. |
| **System** | Job otomatis: kadaluarsa invoice, email, audit log, pembersihan signed URL. |

## 3. Kebutuhan Fungsional (Functional Requirements)

### FR-A Katalog & Discovery
- FR-A1 Menampilkan Home: hero, kategori, produk terbaru, populer, best seller, promo, testimoni, FAQ, footer.
- FR-A2 Halaman kategori & subkategori.
- FR-A3 Halaman detail produk lengkap (galeri, video, harga, diskon, spesifikasi, FAQ, changelog).
- FR-A4 Live Demo / Preview sesuai tipe template.
- FR-A5 Pencarian dengan autocomplete + filter (kategori, harga, terbaru, populer, rating).

### FR-B Akun
- FR-B1 Registrasi, login, logout (JWT + refresh token, HttpOnly cookie).
- FR-B2 Dashboard user: riwayat pembelian, daftar download, wishlist, profil, ganti password.
- FR-B3 Verifikasi email (opsional tahap lanjut).

### FR-C Transaksi (Manual Transfer dulu)
- FR-C1 Checkout → membuat **Invoice** (status `WAITING_PAYMENT`).
- FR-C2 User upload bukti transfer.
- FR-C3 Admin verifikasi → status `PAID` (atau `REJECTED`).
- FR-C4 Setelah `PAID`, user bisa download.
- FR-C5 Kupon: diskon persen / nominal, minimal pembelian, tanggal kadaluarsa.
- FR-C6 Metode pembayaran ditampilkan: Transfer, QRIS, GoPay, OVO, DANA, ShopeePay, Bank Transfer.

### FR-D Download Aman
- FR-D1 File disimpan di object storage privat (Cloudflare R2).
- FR-D2 Download hanya via **signed URL** berlaku **10 menit**.
- FR-D3 Batas maksimal **5x download** per lisensi.
- FR-D4 Setiap download dicatat (audit).

### FR-E Konten
- FR-E1 Blog SEO-friendly: rich text, kategori, tag, komentar.
- FR-E2 Testimoni, FAQ global, banner promo dikelola admin.
- FR-E3 Review produk (rating, komentar, foto) — hanya pembeli.

### FR-F Admin Panel
- Dashboard (grafik penjualan, produk terlaris, revenue, order, user baru, statistik download).
- Kelola: Produk, Kategori, Banner, Testimoni, FAQ, Order, Pembayaran, User, Kupon, Blog, SEO, Setting.

### FR-G SEO
- Dynamic meta title/description, Open Graph, Twitter Card, JSON-LD (Product, FAQ, Breadcrumb), sitemap, robots, canonical.

### FR-H Notifikasi
- Toast (frontend) + Email (checkout, pembayaran diterima, pembayaran berhasil, download tersedia).

## 4. Kebutuhan Non-Fungsional (NFR)

| Kode | Kategori | Target |
|------|----------|--------|
| NFR-1 | Performa | LCP < 2.5s, TTFB < 500ms (SSR/ISR + caching + image optimization). |
| NFR-2 | Skalabilitas | Stateless API, horizontal scaling, storage terpisah. |
| NFR-3 | Keamanan | Helmet, rate limit, CSRF, XSS/SQLi protection, CORS ketat, Argon2, JWT rotation, audit log. |
| NFR-4 | Ketersediaan | 99.9% target; health check & graceful shutdown. |
| NFR-5 | Maintainability | Clean architecture, modular, typed end-to-end, test coverage inti > 70%. |
| NFR-6 | Aksesibilitas | Semantik HTML, kontras AA, keyboard nav (Shadcn UI + Radix). |
| NFR-7 | SEO | Skor Lighthouse SEO > 95. |
| NFR-8 | Responsif | Mobile-first, breakpoint sm/md/lg/xl. |

## 5. Aturan Bisnis Kunci (Business Rules)

- **BR-1** Invoice `WAITING_PAYMENT` otomatis `EXPIRED` setelah 24 jam tanpa bukti.
- **BR-2** File hanya bisa didownload jika ada **License** aktif (`order.status = PAID`).
- **BR-3** Signed URL tidak pernah dikembalikan langsung dari DB; selalu di-generate on-demand & short-lived.
- **BR-4** Review hanya boleh dibuat oleh user yang memiliki License produk tsb.
- **BR-5** Harga akhir = `price` − diskon produk − diskon kupon (tidak boleh < 0).
- **BR-6** Soft delete: entitas inti tidak dihapus permanen (kolom `deletedAt`).

## 6. Metode Pembayaran (Fase)

| Fase | Metode | Implementasi |
|------|--------|--------------|
| Fase 1 (MVP) | Manual transfer + upload bukti | Verifikasi admin manual. |
| Fase 2 | QRIS statis / dinamis | Bisa via payment gateway (Midtrans/Xendit). |
| Fase 3 | E-wallet (GoPay/OVO/DANA/ShopeePay) | Otomatis via gateway callback. |

Arsitektur pembayaran dirancang **payment-provider-agnostic** (lihat `02-architecture.md`).

## 7. Out of Scope (fase awal)

- Multi-vendor / seller onboarding (disiapkan di skema, tapi UI menyusul).
- Affiliate/reseller program.
- Subscription/membership berulang.
