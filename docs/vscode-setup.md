# Panduan Pengembangan dengan VS Code

Repo ini sudah menyertakan konfigurasi VS Code (`.vscode/`), jadi setelah
membuka folder dan memasang ekstensi, semuanya langsung siap: IntelliSense,
lint inline, debugging dengan breakpoint, dan task siap-klik.

---

## 1. Persiapan Sekali Saja

### a. Buka folder yang benar

Buka **folder root repo** (`webtemplate/`), **bukan** `apps/api` atau
`apps/web` saja. Monorepo ini memakai npm workspaces — path, task, dan
konfigurasi ESLint bergantung pada root.

```
File → Open Folder… → pilih webtemplate
```

### b. Pasang ekstensi yang direkomendasikan

VS Code akan menawarkan otomatis ("This workspace has extension
recommendations"). Klik **Install All**. Atau buka panel Extensions
(`Ctrl+Shift+X`) → ketik `@recommended` → install.

| Ekstensi                                | Kegunaan                              |
| --------------------------------------- | ------------------------------------- |
| **ESLint** (`dbaeumer.vscode-eslint`)   | Error/warning lint langsung di editor |
| **Prettier** (`esbenp.prettier-vscode`) | Format kode                           |
| **Prisma** (`prisma.prisma`)            | Syntax + autocomplete `schema.prisma` |
| **Tailwind CSS IntelliSense**           | Autocomplete kelas Tailwind           |
| **REST Client** (`humao.rest-client`)   | Uji API dari file `.http`             |
| **Error Lens**                          | Tampilkan error di baris kodenya      |
| **Path Intellisense**                   | Autocomplete path import              |
| **GitLens**                             | Riwayat & blame Git                   |

### c. Install dependency & siapkan database

Buka terminal terintegrasi (`Ctrl+` `` ` ``) di root repo:

```bash
npm install
```

> `npm install` otomatis menjalankan `prisma generate`. Tanpa itu, TypeScript
> akan melaporkan puluhan error `@prisma/client has no exported member` —
> lihat [`troubleshooting.md`](./troubleshooting.md) §1.

Siapkan environment:

```bash
# Windows PowerShell
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local

# macOS / Linux / Git Bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Isi minimal di `apps/api/.env`:

- `DATABASE_URL` → PostgreSQL Anda
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` → masing-masing **minimal 32 karakter**

**Biarkan `R2_*` kosong.** Penyimpanan otomatis memakai disk lokal
(`apps/api/.storage`) sehingga upload bukti transfer bisa diuji tanpa akun
Cloudflare.

Database + skema + data awal:

```bash
docker compose up -d db     # atau pakai PostgreSQL yang sudah Anda punya
npm run prisma:migrate
npm run prisma:seed         # admin: admin@digitemplate.id / Admin#12345
```

### d. Pakai TypeScript dari repo

Agar hasil di editor sama dengan hasil `npm run typecheck`: buka file `.ts`,
tekan `Ctrl+Shift+P` → **TypeScript: Select TypeScript Version** → **Use
Workspace Version**. (Sudah disarankan otomatis lewat `.vscode/settings.json`.)

---

## 2. Menjalankan Aplikasi

### Cara cepat: Task

`Ctrl+Shift+P` → **Tasks: Run Task** → pilih:

| Task                                              | Fungsi                                            |
| ------------------------------------------------- | ------------------------------------------------- |
| **dev: api + web**                                | Jalankan keduanya (API `:4000`, Web `:3000`)      |
| **dev: web**                                      | Hanya frontend                                    |
| **dev: api (debug)**                              | Backend + inspector (untuk debugging)             |
| **check: all**                                    | typecheck + lint + test — jalankan sebelum commit |
| **test: api (watch)**                             | Jest mode watch                                   |
| **prisma: studio**                                | GUI database di `:5555`                           |
| **prisma: migrate dev** / **seed** / **generate** | Operasi Prisma                                    |
| **db: up (docker)**                               | Nyalakan PostgreSQL                               |
| **format: write**                                 | Rapikan format kode                               |

`Ctrl+Shift+B` langsung menjalankan **dev: api + web** (task default build).

### Cara manual

```bash
npm run dev          # api + web paralel
npm run dev:api      # hanya api
npm run dev:web      # hanya web
```

Alamat:

- Frontend → http://localhost:3000
- Admin panel → http://localhost:3000/admin
- API → http://localhost:4000/api/v1
- Health → http://localhost:4000/api/v1/health/ready

---

## 3. Debugging dengan Breakpoint

Buka panel **Run and Debug** (`Ctrl+Shift+D`), pilih konfigurasi, tekan `F5`.

| Konfigurasi                            | Untuk apa                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Attach: API (NestJS)**               | Debug backend. Otomatis menjalankan task watch + inspector, lalu menempel. Breakpoint tetap hidup saat kode di-reload. |
| **Launch: API (ts-node, tanpa watch)** | Menjalankan API langsung dari TypeScript tanpa watch.                                                                  |
| **Debug: Web server-side**             | Debug Server Component / route handler Next.js.                                                                        |
| **Debug: Web client-side (Chrome)**    | Debug kode browser. Jalankan task `dev: web` dulu.                                                                     |
| **Debug: Jest file aktif**             | Debug file test yang sedang dibuka.                                                                                    |
| **Debug: Jest semua test (API)**       | Debug seluruh suite.                                                                                                   |
| **Debug: Full stack (API + Web)**      | Compound: backend + frontend sekaligus.                                                                                |

### Contoh: menelusuri verifikasi pembayaran

1. Buka `apps/api/src/modules/admin/payments/admin-payments.service.ts`
2. Klik di kiri nomor baris pada awal method `approve()` → breakpoint merah muncul
3. `F5` → pilih **Attach: API (NestJS)**
4. Picu dari admin panel, atau dari `apps/api/requests.http` request **#13**
5. Eksekusi berhenti di breakpoint. Periksa `order.items`, `maxDownloads`;
   pakai **Debug Console** untuk mengevaluasi ekspresi

Tombol: `F10` step over · `F11` step into · `F5` continue · `Shift+F5` stop.

> Kalau breakpoint tampil kosong/abu-abu ("Unbound breakpoint"), tunggu
> kompilasi selesai (lihat terminal task: `Found 0 errors`), lalu simpan
> file agar watch me-reload.

---

## 4. Menguji API Tanpa Keluar dari Editor

Buka `apps/api/requests.http` → klik **Send Request** di atas blok yang
diinginkan. File ini memuat alur lengkap yang sudah diberi nomor:

```
1 register → 2 login → 5 daftar produk → 6 checkout
→ 8 invoice → 9 presign → 10 kirim bukti
→ 12 login admin → 13 setujui → 14 lisensi → 16 signed URL unduh
```

Cookie autentikasi tersimpan otomatis antar request, jadi tidak perlu
menyalin token.

---

## 5. Alur Kerja Harian

```bash
git pull
npm install            # kalau package.json berubah
npm run dev
```

Sebelum commit — jalankan task **check: all**, atau:

```bash
npm run typecheck && npm run lint && npm run test
```

Setelah mengubah `prisma/schema.prisma`:

```bash
npm run prisma:migrate   # buat + terapkan migrasi
```

Prisma Client ter-generate otomatis. Kalau IntelliSense masih menampilkan
tipe lama: `Ctrl+Shift+P` → **TypeScript: Restart TS Server**.

---

## 6. Format Kode (Opsional)

Seluruh repo sudah dinormalkan dengan Prettier — `npm run format:check` hijau.
Konfigurasinya ada di `.prettierrc.json`.

`editor.formatOnSave` **dibiarkan mati** sebagai default agar penyimpanan file
tidak pernah mengubah kode di luar yang Anda sunting. Format manual kapan pun
dengan `Shift+Alt+F`.

Kalau Anda ingin format otomatis saat menyimpan, ubah di
`.vscode/settings.json`:

```jsonc
"editor.formatOnSave": true
```

Aman dilakukan karena repo sudah konsisten, jadi tidak akan muncul diff besar
di file yang tidak Anda sentuh.

Perintah terkait:

```bash
npm run format         # rapikan seluruh repo
npm run format:check   # periksa tanpa mengubah (dipakai saat review)
```

---

## 7. Tips Navigasi

| Aksi                             | Shortcut        |
| -------------------------------- | --------------- |
| Cari file                        | `Ctrl+P`        |
| Cari simbol di workspace         | `Ctrl+T`        |
| Cari teks di semua file          | `Ctrl+Shift+F`  |
| Ke definisi                      | `F12`           |
| Lihat definisi sekilas           | `Alt+F12`       |
| Cari semua referensi             | `Shift+F12`     |
| Rename simbol (aman lintas file) | `F2`            |
| Quick fix / auto-import          | `Ctrl+.`        |
| Command Palette                  | `Ctrl+Shift+P`  |
| Terminal                         | `Ctrl+` `` ` `` |

Import memakai alias, bukan path relatif panjang:

- API → `@/modules/...` (dipetakan ke `apps/api/src/`)
- Web → `@/components/...` (dipetakan ke `apps/web/src/`)

VS Code sudah diatur agar auto-import memakai alias ini.

---

## 8. Peta Kode Singkat

| Ingin mengubah…             | Buka                                   |
| --------------------------- | -------------------------------------- |
| Skema database              | `apps/api/prisma/schema.prisma`        |
| Endpoint API                | `apps/api/src/modules/<fitur>/`        |
| Aturan auth/token           | `apps/api/src/modules/auth/`           |
| Verifikasi pembayaran       | `apps/api/src/modules/admin/payments/` |
| Logika download aman        | `apps/api/src/modules/downloads/`      |
| Penyimpanan file (R2/lokal) | `apps/api/src/modules/media/`          |
| Halaman publik              | `apps/web/src/app/(marketing)/`        |
| Admin panel                 | `apps/web/src/app/admin/`              |
| Komponen UI                 | `apps/web/src/components/`             |
| Klien API frontend          | `apps/web/src/lib/api.ts`              |
| SEO (meta, JSON-LD)         | `apps/web/src/lib/seo.ts`              |

---

## 9. Kalau Ada Masalah

Lihat **[`troubleshooting.md`](./troubleshooting.md)** — memuat error yang
sudah pernah terjadi beserta penyebabnya:

1. Puluhan error `@prisma/client` → Prisma Client belum di-generate
2. `Object storage (R2) belum dikonfigurasi` → biarkan `R2_*` kosong
3. `unsupported type was passed to use()` → soal `params` Next.js
4. Tipe React bentrok
5. `next lint` gagal
6. Migrasi Prisma / `DATABASE_URL`
7. Error kompilasi "nyangkut" saat `start:dev`
8. Catatan Windows (argon2 butuh build tools)

Khusus VS Code:

| Gejala                     | Solusi                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| ESLint tidak jalan         | Panel **Output** → pilih **ESLint** untuk melihat error. Pastikan folder root repo yang dibuka. |
| IntelliSense lambat/salah  | `Ctrl+Shift+P` → **TypeScript: Restart TS Server**                                              |
| Tipe Prisma tidak dikenali | `npm run prisma:generate`, lalu restart TS Server                                               |
| Autocomplete Tailwind mati | Pastikan ekstensi Tailwind aktif; buka file di dalam `apps/web`                                 |
| Breakpoint abu-abu         | Tunggu `Found 0 errors` di terminal, lalu simpan file                                           |
| Port 3000/4000 dipakai     | Windows: `netstat -ano \| findstr :4000` lalu `taskkill /PID <pid> /F`                          |
