# Tahap 1 — Flowchart Proses Utama

## 1. Registrasi & Login (JWT + Refresh Rotation)

```mermaid
flowchart TD
  A[User isi form] --> B{Register / Login}
  B -->|Register| C[Validasi + cek email unik]
  C --> D[Hash password Argon2id]
  D --> E[Simpan user role=USER]
  B -->|Login| F[Cari user + verify Argon2]
  F -->|invalid| G[401 + audit LOGIN_FAILED]
  E --> H[Terbitkan access token 15m]
  F -->|valid| H
  H --> I[Terbitkan refresh token 7d]
  I --> J[Set HttpOnly Secure cookie]
  J --> K[Response profil]
```

Refresh: klien memanggil `/auth/refresh`; server memvalidasi refresh token, **mendeteksi reuse** (token lama sudah dipakai → cabut seluruh sesi), lalu menerbitkan pasangan token baru.

## 2. Checkout → Invoice → Verifikasi Manual → Download

```mermaid
flowchart TD
  Start[User klik Checkout] --> Auth{Login?}
  Auth -->|tidak| Login[Redirect login]
  Auth -->|ya| Coupon[Terapkan kupon opsional]
  Coupon --> Calc[Hitung total BR-5]
  Calc --> Inv[Buat Order + Invoice: WAITING_PAYMENT]
  Inv --> Mail1[[Email: instruksi pembayaran]]
  Inv --> Show[Tampilkan rekening / QRIS + batas 24 jam]
  Show --> Upload[User upload bukti transfer]
  Upload --> Pending[PaymentProof: PENDING]
  Pending --> Mail2[[Email: bukti diterima]]
  Pending --> Admin{Admin verifikasi}
  Admin -->|Tolak| Reject[Proof REJECTED + alasan]
  Reject --> Show
  Admin -->|Setuju| Paid[Order PAID + buat License per item]
  Paid --> Mail3[[Email: pembayaran berhasil + download tersedia]]
  Paid --> Ready[Tombol Download aktif]
```

## 3. Kadaluarsa Invoice (Scheduled Job — BR-1)

```mermaid
flowchart TD
  Cron[Cron tiap 15 menit] --> Q[Ambil Invoice WAITING_PAYMENT > 24 jam]
  Q --> Exp[Set EXPIRED + lepas stok kupon]
  Exp --> Mail[[Email: invoice kadaluarsa]]
```

## 4. Download Aman (BR-2, BR-3, FR-D)

```mermaid
flowchart TD
  Req[User klik Download item] --> Lic{Punya License aktif?}
  Lic -->|tidak| Deny[403 Forbidden]
  Lic -->|ya| Quota{download_count < 5?}
  Quota -->|tidak| Limit[429 / kuota habis]
  Quota -->|ya| Sign[Generate signed URL R2 TTL 10 menit]
  Sign --> Inc[+1 download_count + catat DownloadLog]
  Inc --> Redirect[Kembalikan URL sekali pakai]
```

## 5. Review Produk (BR-4)

```mermaid
flowchart TD
  R[User buka produk yang dibeli] --> Own{Punya License?}
  Own -->|tidak| Hide[Form review disembunyikan]
  Own -->|ya| Form[Isi rating + komentar + foto]
  Form --> Save[Simpan Review status=PUBLISHED/PENDING]
  Save --> Recalc[Hitung ulang rating rata2 produk]
```

## 6. Publikasi Blog & SEO

```mermaid
flowchart TD
  Draft[Admin tulis post rich text] --> SEOForm[Isi meta title/desc, slug, OG image]
  SEOForm --> Publish{Publish?}
  Publish -->|Draft| Save1[status=DRAFT]
  Publish -->|Publish| Save2[status=PUBLISHED + publishedAt]
  Save2 --> Sitemap[Masuk sitemap.xml + JSON-LD Article]
```
