import { PrismaClient, Role, ProductStatus, DemoType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'template-website', name: 'Template Website' },
  { slug: 'template-spreadsheet', name: 'Template Google Spreadsheet' },
  { slug: 'template-excel', name: 'Template Excel' },
  { slug: 'template-dashboard', name: 'Template Dashboard' },
  { slug: 'template-invoice', name: 'Template Invoice' },
  { slug: 'template-pos', name: 'Template POS' },
  { slug: 'template-hr', name: 'Template HR' },
  { slug: 'template-keuangan', name: 'Template Keuangan' },
  { slug: 'template-admin', name: 'Template Admin' },
  { slug: 'template-bisnis', name: 'Template Bisnis' },
  { slug: 'template-canva', name: 'Template Canva' },
  { slug: 'template-notion', name: 'Template Notion' },
];

async function main(): Promise<void> {
  // --- Admin default ---
  const adminEmail = 'admin@digitemplate.id';
  const passwordHash = await argon2.hash('Admin#12345', {
    type: argon2.argon2id,
  });
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Administrator',
      role: Role.ADMIN,
      passwordHash,
    },
  });

  // --- Kategori ---
  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, sortOrder: i },
    });
  }

  const website = await prisma.category.findUnique({
    where: { slug: 'template-website' },
  });
  const keuangan = await prisma.category.findUnique({
    where: { slug: 'template-keuangan' },
  });

  // --- Produk contoh ---
  if (website) {
    await prisma.product.upsert({
      where: { slug: 'landing-page-saas-pro' },
      update: {},
      create: {
        slug: 'landing-page-saas-pro',
        name: 'Landing Page SaaS Pro',
        shortDesc: 'Template landing page modern untuk produk SaaS.',
        description:
          'Template landing page SaaS lengkap: hero, fitur, pricing, testimoni, FAQ. Dibuat dengan Next.js + Tailwind.',
        features: ['Responsive', 'Dark mode', 'SEO ready', 'Framer Motion'],
        status: ProductStatus.PUBLISHED,
        categoryId: website.id,
        price: 150000,
        discountPrice: 99000,
        demoType: DemoType.WEBSITE,
        demoUrl: 'https://example.com/demo/saas',
        version: '1.2.0',
        fileFormat: 'ZIP (Next.js)',
        isFeatured: true,
        isBestSeller: true,
      },
    });
  }

  if (keuangan) {
    await prisma.product.upsert({
      where: { slug: 'laporan-keuangan-umkm' },
      update: {},
      create: {
        slug: 'laporan-keuangan-umkm',
        name: 'Laporan Keuangan UMKM',
        shortDesc: 'Spreadsheet laporan keuangan otomatis untuk UMKM.',
        description:
          'Template Google Spreadsheet untuk laba rugi, arus kas, dan neraca UMKM. Otomatis dan mudah dipakai.',
        features: ['Auto-kalkulasi', 'Grafik', 'Multi-bulan'],
        status: ProductStatus.PUBLISHED,
        categoryId: keuangan.id,
        price: 75000,
        demoType: DemoType.SPREADSHEET,
        demoUrl: 'https://docs.google.com/spreadsheets/d/demo',
        version: '2.0.0',
        fileFormat: 'Google Sheets',
        isFeatured: true,
      },
    });
  }

  // --- FAQ & Testimoni global ---
  await prisma.faq.createMany({
    data: [
      {
        question: 'Bagaimana cara mengunduh setelah membeli?',
        answer:
          'Setelah pembayaran diverifikasi admin, tombol download aktif di dashboard Anda. Link berlaku 10 menit.',
        category: 'pembelian',
      },
      {
        question: 'Metode pembayaran apa saja yang didukung?',
        answer:
          'Saat ini transfer manual (upload bukti). QRIS & e-wallet menyusul.',
        category: 'pembayaran',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.siteSetting.upsert({
    where: { key: 'payment.bank' },
    update: {},
    create: {
      key: 'payment.bank',
      group: 'payment',
      value: {
        bankName: process.env.BANK_NAME ?? 'BCA',
        accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? '1234567890',
        accountHolder: process.env.BANK_ACCOUNT_HOLDER ?? 'PT DigiTemplate',
      },
    },
  });

  console.log('Seed selesai. Admin: admin@digitemplate.id / Admin#12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
