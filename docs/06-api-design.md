# Tahap 2 — API Design (REST Endpoints)

Base URL: `/{API_PREFIX}` (default `/api/v1`). Format JSON. Auth via **HttpOnly cookie**
(access + refresh) atau header `Authorization: Bearer <token>` untuk klien non-browser.

## Konvensi

- **Sukses**: `{ "data": ..., "meta": { ... } }`
- **Error**: `{ "statusCode", "message", "error", "path", "timestamp" }`
- **Pagination**: query `?page=1&limit=20&sort=createdAt:desc` → `meta.pagination`.
- **Otorisasi**: `🔒` = butuh login, `👑` = butuh ADMIN.

## Auth

| Method | Path                    | Deskripsi                              |
| ------ | ----------------------- | -------------------------------------- |
| POST   | `/auth/register`        | Daftar (email, password, name).        |
| POST   | `/auth/login`           | Login → set cookie access+refresh.     |
| POST   | `/auth/refresh`         | Rotasi token (reuse detection).        |
| POST   | `/auth/logout`          | 🔒 Cabut refresh token + clear cookie. |
| GET    | `/auth/me`              | 🔒 Profil user saat ini.               |
| POST   | `/auth/change-password` | 🔒 Ganti password.                     |

## Users (self)

| Method          | Path                  |                             |
| --------------- | --------------------- | --------------------------- |
| PATCH           | `/users/me`           | 🔒 Update profil.           |
| GET             | `/users/me/orders`    | 🔒 Riwayat pembelian.       |
| GET             | `/users/me/downloads` | 🔒 Daftar lisensi/download. |
| GET/POST/DELETE | `/users/me/wishlist`  | 🔒 Wishlist.                |
| GET/POST        | `/users/me/addresses` | 🔒 Alamat.                  |

## Catalog (publik)

| Method | Path                                                                                |                                                     |
| ------ | ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| GET    | `/categories`                                                                       | Pohon kategori.                                     |
| GET    | `/products`                                                                         | List + filter `?category=&min=&max=&tag=&sort=&q=`. |
| GET    | `/products/featured` `/products/best-seller` `/products/latest` `/products/popular` | Rail Home.                                          |
| GET    | `/products/:slug`                                                                   | Detail produk.                                      |
| GET    | `/products/:slug/reviews`                                                           | Review produk.                                      |
| GET    | `/search?q=`                                                                        | Autocomplete + hasil.                               |

## Reviews

| Method | Path                    |                                       |
| ------ | ----------------------- | ------------------------------------- |
| POST   | `/products/:id/reviews` | 🔒 Buat review (harus punya License). |

## Cart & Checkout

| Method | Path                |                             |
| ------ | ------------------- | --------------------------- |
| POST   | `/coupons/validate` | Cek kupon terhadap cart.    |
| POST   | `/orders/checkout`  | 🔒 Buat Order + Invoice.    |
| GET    | `/orders/:number`   | 🔒 Detail order milik user. |

## Payment (manual)

| Method | Path                      |                                       |
| ------ | ------------------------- | ------------------------------------- |
| GET    | `/invoices/:number`       | 🔒 Detail invoice + instruksi bayar.  |
| POST   | `/invoices/:number/proof` | 🔒 Upload bukti transfer (multipart). |

## Download

| Method | Path                                       |                                             |
| ------ | ------------------------------------------ | ------------------------------------------- |
| GET    | `/downloads/:licenseId/files`              | 🔒 Daftar file yang bisa diunduh.           |
| POST   | `/downloads/:licenseId/files/:fileId/sign` | 🔒 Dapatkan signed URL (TTL 10m, kuota 5x). |

## Blog (publik + admin)

| Method | Path                              |                      |
| ------ | --------------------------------- | -------------------- |
| GET    | `/blog/posts` `/blog/posts/:slug` | List / detail.       |
| GET    | `/blog/categories` `/blog/tags`   | Taksonomi.           |
| POST   | `/blog/posts/:id/comments`        | Komentar (moderasi). |

## Content

| Method | Path                                                       |                                     |
| ------ | ---------------------------------------------------------- | ----------------------------------- |
| GET    | `/content/banners` `/content/testimonials` `/content/faqs` | Data Home.                          |
| GET    | `/content/settings/:group`                                 | Setting publik (mis. metode bayar). |

## SEO

| Method | Path                 |                                             |
| ------ | -------------------- | ------------------------------------------- |
| GET    | `/seo/sitemap`       | Data sumber sitemap (produk/blog/kategori). |
| GET    | `/seo/product/:slug` | Meta + JSON-LD Product.                     |

## Admin (`👑` semua)

| Resource   | Endpoints                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| Dashboard  | `GET /admin/stats/overview`, `/admin/stats/sales?range=`, `/admin/stats/top-products`, `/admin/stats/downloads` |
| Products   | `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/:id`, `POST /admin/products/:id/files`            |
| Categories | CRUD `/admin/categories`                                                                                        |
| Orders     | `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status`                                  |
| Payments   | `GET /admin/payments`, `POST /admin/payments/:proofId/approve`, `POST /admin/payments/:proofId/reject`          |
| Coupons    | CRUD `/admin/coupons`                                                                                           |
| Blog       | CRUD `/admin/blog/posts`, moderasi `/admin/blog/comments/:id`                                                   |
| Content    | CRUD `/admin/banners`, `/admin/testimonials`, `/admin/faqs`, `/admin/settings`                                  |
| Users      | `GET /admin/users`, `PATCH /admin/users/:id`                                                                    |
| Media      | `POST /admin/media/presign` (upload ke R2)                                                                      |

## Health

| Method | Path            |                       |
| ------ | --------------- | --------------------- |
| GET    | `/health/live`  | Liveness.             |
| GET    | `/health/ready` | Readiness (DB check). |

## Rate limiting (contoh)

| Grup                | Limit                 |
| ------------------- | --------------------- |
| Global              | 100 req / menit / IP  |
| `/auth/*`           | 10 req / menit / IP   |
| `/downloads/*/sign` | 20 req / menit / user |
