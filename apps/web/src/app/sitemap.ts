import type { MetadataRoute } from 'next';
import { serverFetch } from '@/lib/api';
import type { Product } from '@/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/produk',
    '/kategori',
    '/blog',
    '/faq',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.7,
  }));

  let products: Product[] = [];
  try {
    const res = await serverFetch<{ data: Product[] }>('/products?limit=60');
    products = (res as unknown as Product[]) ?? [];
  } catch {
    products = [];
  }

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/produk/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
