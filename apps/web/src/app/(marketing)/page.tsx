import { Hero } from '@/components/sections/hero';
import { ProductRail } from '@/components/sections/product-rail';
import { serverFetch } from '@/lib/api';
import type { Product } from '@/types';

// ISR: perbarui tiap 5 menit
export const revalidate = 300;

async function safeRail(path: string): Promise<Product[]> {
  try {
    return await serverFetch<Product[]>(path, { revalidate: 300 });
  } catch {
    // API belum tersedia (mis. saat build awal) → tampilkan kosong
    return [];
  }
}

export default async function HomePage() {
  const [latest, popular, featured, bestSeller] = await Promise.all([
    safeRail('/products/latest'),
    safeRail('/products/popular'),
    safeRail('/products/featured'),
    safeRail('/products/best-seller'),
  ]);

  return (
    <>
      <Hero />
      <ProductRail
        title="Produk Unggulan"
        subtitle="Pilihan terbaik dari tim kami"
        products={featured}
        href="/produk?sort=featured"
      />
      <ProductRail
        title="Best Seller"
        subtitle="Paling banyak dibeli"
        products={bestSeller}
        href="/produk?sort=popular"
      />
      <ProductRail
        title="Terbaru"
        subtitle="Baru ditambahkan"
        products={latest}
        href="/produk?sort=latest"
      />
      <ProductRail
        title="Populer"
        subtitle="Favorit pengguna"
        products={popular}
        href="/produk?sort=popular"
      />
    </>
  );
}
