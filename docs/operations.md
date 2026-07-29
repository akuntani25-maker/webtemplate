# Operasional — Backup, Restore, Migrasi

## Migrasi Prisma

### Alur pengembangan
```bash
# Ubah apps/api/prisma/schema.prisma, lalu:
npm run prisma:migrate            # buat migrasi + terapkan ke DB lokal
npm run prisma:generate           # regenerasi Prisma Client
```

### Produksi
```bash
npm --workspace @digitemplate/api run prisma:deploy   # terapkan migrasi yang sudah ada
```
> Jangan pakai `migrate dev` di produksi. Dockerfile api menjalankan
> `prisma migrate deploy` otomatis saat start.

### Membuat migrasi tanpa menerapkan
```bash
npx prisma migrate dev --create-only --name nama_migrasi
```

## Backup Database (PostgreSQL)

### Dump penuh
```bash
pg_dump "$DATABASE_URL" -Fc -f backup_$(date +%F).dump
```
- `-Fc` = format custom (kompresi, cocok untuk restore selektif).

### Dump khusus data (tanpa schema)
```bash
pg_dump "$DATABASE_URL" --data-only -Fc -f data_$(date +%F).dump
```

### Terjadwal (contoh cron harian 02:00)
```cron
0 2 * * * pg_dump "$DATABASE_URL" -Fc -f /backups/db_$(date +\%F).dump && \
          find /backups -name 'db_*.dump' -mtime +14 -delete
```

> Di Supabase, backup otomatis tersedia sesuai plan. Tetap simpan salinan
> off-site (mis. ke R2/S3) untuk keamanan.

## Restore Database

### Restore penuh (ke DB kosong)
```bash
pg_restore --clean --if-exists -d "$DATABASE_URL" backup_2026-07-29.dump
```

### Restore selektif (satu tabel)
```bash
pg_restore -d "$DATABASE_URL" -t products backup_2026-07-29.dump
```

### Verifikasi setelah restore
```bash
npm --workspace @digitemplate/api run prisma:generate
# cek koneksi & sanity
curl -s http://localhost:4000/api/v1/health/ready
```

## Backup Object Storage (R2)

File digital & bukti transfer ada di R2. Sinkronkan berkala ke bucket/lokasi
lain memakai `rclone` atau AWS CLI (R2 S3-compatible):
```bash
aws s3 sync s3://digitemplate ./r2-backup \
  --endpoint-url "$R2_ENDPOINT"
```

## Rotasi Secret

- Ganti `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` akan meng-invalidasi seluruh
  sesi (user perlu login ulang). Lakukan saat maintenance window.
- Rotasi kredensial R2 & DB via dashboard masing-masing lalu update env Railway.

## Pemulihan Bencana (ringkas)

1. Provision DB baru → `pg_restore` dari dump terbaru.
2. Set `DATABASE_URL` baru di Railway → `prisma migrate deploy`.
3. Restore R2 bila perlu.
4. Verifikasi `/health/ready`, login admin, uji satu alur beli→download.
