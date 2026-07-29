import type { Metadata } from 'next';
import type { Product } from '@/types';
import { formatIDR } from './utils';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'DigiTemplate';

/** Metadata dasar (Open Graph + Twitter Card) untuk sebuah halaman. */
export function buildMetadata(opts: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${opts.path ?? ''}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: opts.image ? [{ url: opts.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: opts.image ? [opts.image] : undefined,
    },
  };
}

/** JSON-LD schema.org/Product untuk halaman detail produk. */
export function productJsonLd(product: Product) {
  const price = product.discountPrice ?? product.price;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDesc ?? product.description.slice(0, 160),
    image: product.thumbnailUrl ?? undefined,
    brand: { '@type': 'Brand', name: SITE_NAME },
    aggregateRating:
      product.ratingCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          }
        : undefined,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/produk/${product.slug}`,
    },
    // Harga terformat untuk keperluan tampilan
    _display: formatIDR(price),
  };
}

/** JSON-LD BreadcrumbList. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
