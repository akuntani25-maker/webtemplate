# Troubleshooting

## 1. Ratusan error TypeScript menyebut `@prisma/client`

**Gejala** (bisa 40–60 error sekaligus):

```
error TS2305: Module '"@prisma/client"' has no exported member 'Role'.
error TS2305: Module '"@prisma/client"' has no exported member 'ProductStatus'.
error TS2694: Namespace '....prisma/client/default".Prisma' has no exported member 'ProductWhereInput'.
error TS2339: Property 'sql' does not exist on type 'typeof Prisma'.
error TS7006: Parameter 'e' implicitly has an 'any' type.
```

**Penyebab.** Prisma Client **belum di-generate**. Paket `@prisma/client` yang
terpasang dari npm hanyalah _stub_; seluruh tipe (enum `Role`/`DemoType`/…,
`Prisma.*WhereInput`, `Prisma.sql`, tipe hasil query) baru dibuat saat
`prisma generate` dijalankan terhadap `prisma/schema.prisma`. Karena tipe hasil
query menjadi `any`, error `implicit any` (TS7006) ikut merembet — itu **akibat**,
bukan bug terpisah.

**Solusi:**

```bash
# dari root repo
npm run prisma:generate

# atau dari apps/api
cd apps/api && npx prisma generate
```

Tidak perlu database aktif dan tidak perlu `DATABASE_URL` untuk `generate`.

> Sejak perbaikan ini, `apps/api` punya script **`postinstall: prisma generate`**,
> sehingga `npm install` otomatis menghasilkan client. Script `build` juga
> menjalankan `prisma generate` lebih dulu. Jadi kasus di atas seharusnya tidak
> terjadi lagi pada clone baru.

**Kapan perlu generate ulang:**

- Setelah mengubah `prisma/schema.prisma`.
- Setelah `rm -rf node_modules` / `npm ci`.
- Setelah berganti branch yang mengubah schema.

## 2. `Object storage (R2) belum dikonfigurasi`

**Gejala.** Saat upload bukti transfer atau upload file produk:

```
ERROR [Exception] Object storage (R2) belum dikonfigurasi
    at StorageService.ensure (.../storage.service.ts)
```

**Status: sudah diperbaiki.** Dulu `StorageService` hanya punya driver R2,
sehingga pengembangan lokal mustahil tanpa akun Cloudflare. Sekarang ada
**dua driver** dan pemilihannya otomatis:

| `STORAGE_DRIVER` | Perilaku                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `auto` (default) | Pakai **R2** bila `R2_ENDPOINT` + `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` lengkap; jika belum → **disk lokal** + peringatan di log. |
| `r2`             | Wajib R2. Gagal saat start bila kredensial kurang — **pakai ini di produksi**.                                                          |
| `local`          | Paksa disk lokal (hanya pengembangan).                                                                                                  |

Jadi untuk lokal cukup **tidak mengisi** `R2_*`. File tersimpan di
`apps/api/.storage` (sudah masuk `.gitignore`).

**Driver lokal tetap aman**, bukan sekadar melewati proteksi:

- File tidak bisa diakses tanpa **token HMAC-SHA256** yang ditandatangani server.
- Token **kedaluwarsa** (download 10 menit, upload 5 menit).
- Kuota **5× download per lisensi** tetap ditegakkan.
- Ada proteksi **path traversal** pada object key.

**Untuk produksi**, isi `R2_*` dan set `STORAGE_DRIVER=r2`. Bila driver lokal
aktif saat `NODE_ENV=production`, API mencatat error karena file tidak
persisten/terbagi antar instance.

## 3. `Error: An unsupported type was passed to use(): [object Object]`

**Penyebab.** `use(params)` dipakai pada versi Next.js < 15, di mana `params`
masih objek biasa (bukan Promise).

**Solusi.** Proyek ini memakai **Next.js 16**, di mana `params` adalah Promise:

- Server Component: `const { slug } = await params;`
- Client Component: `const { slug } = use(params);`

Pastikan dependensi sudah ter-update (`npm install`) dan hapus cache build:

```bash
rm -rf apps/web/.next
```

## 4. Tipe React bentrok (`ReactNode is not assignable to ReactNode`)

**Gejala.** Error aneh di komponen Radix/Shadcn, mis. pada `Slot`/`Button`,
menyebut dua path `@types/react` berbeda.

**Penyebab.** Ada dua versi `@types/react` di dependency tree (Radix UI masih
menarik v18 secara transitif, sementara React 19 butuh v19).

**Solusi.** Root `package.json` sudah memaksa versi tunggal:

```json
"overrides": {
  "@types/react": "^19.2.0",
  "@types/react-dom": "^19.2.0"
}
```

Bila masih bentrok, lakukan install bersih:

```bash
rm -rf node_modules apps/web/node_modules apps/api/node_modules package-lock.json
npm install
```

Verifikasi hanya ada satu versi:

```bash
npm ls @types/react
```

## 5. `next lint` gagal: "Invalid project directory provided, no such directory: .../lint"

**Penyebab.** `next lint` dihapus pada Next.js 16.

**Solusi.** Sudah diganti: `apps/web` memakai ESLint flat config
(`eslint.config.mjs`) dan script `lint` = `eslint .`. Jalankan:

```bash
npm run lint:web
```

## 6. Migrasi Prisma gagal / `DATABASE_URL` tidak valid

- `prisma generate` **tidak** butuh DB, tapi `migrate`/`db push`/`studio` **butuh**.
- Pastikan `apps/api/.env` ada (copy dari `.env.example`) dan `DATABASE_URL` benar.
- Jalankan Postgres lokal cepat: `docker compose up -d db`.
- Supabase: gunakan koneksi langsung (port 5432) untuk `migrate deploy`;
  pooler (6543) untuk runtime — lihat `docs/deployment.md`.

## 7. Error kompilasi hilang-timbul saat `start:dev`

`nest start --watch` memakai cache inkremental (`tsconfig.tsbuildinfo`).
Bila error terasa "nyangkut" setelah generate/ganti branch:

```bash
cd apps/api
rm -rf dist *.tsbuildinfo
npm run start:dev
```

## 8. Windows

- Butuh Node.js ≥ 20. Cek: `node -v`.
- Paket `argon2` memerlukan build tools native. Bila `npm install` gagal saat
  argon2, pasang **Visual Studio Build Tools** (workload "Desktop development
  with C++"), atau jalankan backend via Docker (`docker compose up -d api`).
- Jalankan perintah npm dari **root repo** agar workspaces terbaca benar.
