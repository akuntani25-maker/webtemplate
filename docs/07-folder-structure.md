# Tahap 2 — Struktur Folder

Monorepo berbasis **npm workspaces**.

```
webtemplate/
├── package.json                # root workspace + script orkestrasi
├── docker-compose.yml          # postgres + api + web (dev/prod)
├── .github/workflows/ci.yml    # CI/CD
├── docs/                       # dokumentasi (Tahap 1-15)
├── packages/
│   └── config/                 # konfigurasi bersama (tsconfig base, eslint) — opsional
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/         # env validation (Zod), config service
│   │   │   ├── common/         # guards, decorators, filters, interceptors, pipes
│   │   │   ├── database/       # PrismaService + soft-delete extension
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── catalog/        # products, categories, tags, reviews
│   │   │   │   ├── media/          # R2 signed upload/download
│   │   │   │   ├── orders/         # cart, order, invoice, license
│   │   │   │   ├── payments/       # proof, provider adapter, verifikasi
│   │   │   │   ├── coupons/
│   │   │   │   ├── downloads/
│   │   │   │   ├── wishlist/
│   │   │   │   ├── blog/
│   │   │   │   ├── content/        # banner, testimonial, faq, settings
│   │   │   │   ├── admin/          # dashboard & agregasi
│   │   │   │   ├── notifications/  # email
│   │   │   │   ├── audit/
│   │   │   │   └── health/
│   │   │   └── jobs/           # scheduled tasks (invoice expiry)
│   │   ├── test/               # e2e
│   │   └── Dockerfile
│   └── web/                    # Next.js frontend (App Router)
│       ├── src/
│       │   ├── app/            # routes (App Router)
│       │   │   ├── (marketing)/    # home, kategori, produk, blog
│       │   │   ├── (auth)/         # login, register
│       │   │   ├── (account)/      # dashboard user
│       │   │   ├── admin/          # admin panel
│       │   │   ├── sitemap.ts
│       │   │   ├── robots.ts
│       │   │   └── layout.tsx
│       │   ├── components/     # ui (shadcn), sections, shared
│       │   ├── lib/            # api client (axios), query client, utils, seo
│       │   ├── hooks/
│       │   ├── stores/         # state (zustand) untuk cart/wishlist
│       │   └── types/
│       ├── public/
│       ├── tailwind.config.ts
│       └── Dockerfile
```

## Prinsip penataan

- **Feature-first** di backend: setiap modul berisi controller/service/repository/dto sendiri.
- **Route groups** di Next.js (`(marketing)`, `(auth)`, `(account)`, `admin`) memisahkan layout & concern.
- **Barrel export** dijaga minimal untuk menghindari circular import.
- **Shared types** antara FE-BE: kontrak API didokumentasikan; opsi lanjut memakai OpenAPI/Zod-to-type.
