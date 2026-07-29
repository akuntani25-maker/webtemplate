# Tahap 1 — Entity Relationship Diagram (ERD)

Semua entitas memakai **UUID** primary key, **timestamp** (`createdAt`, `updatedAt`),
dan **soft delete** (`deletedAt`) pada entitas inti.

```mermaid
erDiagram
  User ||--o{ RefreshToken : has
  User ||--o{ Order : places
  User ||--o{ Review : writes
  User ||--o{ WishlistItem : saves
  User ||--o{ BlogComment : posts
  User ||--o{ DownloadLog : triggers
  User ||--o{ AuditLog : generates
  User ||--o{ Address : owns

  Category ||--o{ Category : "parent/child"
  Category ||--o{ Product : contains

  Product ||--o{ ProductImage : has
  Product ||--o{ ProductFile : has
  Product ||--o{ ProductFaq : has
  Product ||--o{ ProductChangelog : has
  Product ||--o{ Review : receives
  Product ||--o{ OrderItem : "sold in"
  Product ||--o{ WishlistItem : "wished in"
  Product }o--o{ Tag : tagged

  Order ||--|| Invoice : has
  Order ||--o{ OrderItem : contains
  Order ||--o{ License : grants
  Order }o--o| Coupon : uses

  Invoice ||--o{ PaymentProof : receives

  OrderItem ||--|| License : "unlocks (per item)"
  License ||--o{ DownloadLog : records
  ProductFile ||--o{ DownloadLog : "downloaded as"

  Coupon ||--o{ Order : applied

  BlogPost }o--|| BlogCategory : in
  BlogPost }o--o{ BlogTag : tagged
  BlogPost ||--o{ BlogComment : has

  Banner }o--o| Product : "links to"
  SiteSetting ||..|| System : singleton
  Testimonial }o--o| Product : about
  Faq ||..|| System : global

  User {
    uuid id PK
    string email UK
    string passwordHash
    enum role
    string name
    string avatarUrl
    datetime deletedAt
  }

  Product {
    uuid id PK
    uuid categoryId FK
    string slug UK
    string name
    text description
    int price
    int discountPrice
    enum demoType
    string demoUrl
    string version
    string fileFormat
    int fileSizeBytes
    float ratingAvg
    int ratingCount
    int downloadCount
    int purchaseCount
    enum status
    datetime deletedAt
  }

  Order {
    uuid id PK
    uuid userId FK
    uuid couponId FK
    string number UK
    int subtotal
    int discountTotal
    int grandTotal
    enum status
    datetime deletedAt
  }

  Invoice {
    uuid id PK
    uuid orderId FK
    string number UK
    enum paymentMethod
    enum status
    datetime expiresAt
  }

  License {
    uuid id PK
    uuid orderItemId FK
    uuid userId FK
    uuid productId FK
    int downloadCount
    int maxDownloads
    boolean active
  }
```

## Catatan Relasi Penting

- **Order 1—1 Invoice**: satu order menghasilkan satu invoice pembayaran.
- **OrderItem 1—1 License**: setiap item yang dibeli membuka satu lisensi download (kuota terpisah per item).
- **License 1—N DownloadLog**: setiap upaya download dicatat (untuk kuota & audit).
- **Category self-relation**: mendukung kategori & subkategori (`parentId`).
- **Product N—N Tag**, **BlogPost N—N BlogTag**: via tabel relasi implisit Prisma.
- **Coupon 1—N Order**: satu kupon dipakai banyak order (dengan batas & kadaluarsa).

Detail tipe kolom & index ada di `apps/api/prisma/schema.prisma` dan `05-database-design.md`.
