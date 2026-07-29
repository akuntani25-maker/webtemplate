import Link from 'next/link';
import { ProductCard } from './product-card';
import type { Product } from '@/types';

export function ProductRail({
  title,
  subtitle,
  products,
  href,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  href?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className="container py-14">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
