import Link from 'next/link';
import { Star, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const hasDiscount =
    product.discountPrice != null && product.discountPrice < product.price;

  return (
    <Link href={`/produk/${product.slug}`} className="group block">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="aspect-[4/3] bg-muted">
          {product.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              {product.category?.name ?? 'Template'}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            {product.category?.name}
          </p>
          <h3 className="mt-1 line-clamp-1 font-semibold group-hover:text-primary">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {product.ratingAvg.toFixed(1)} ({product.ratingCount})
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {product.downloadCount}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-bold text-primary">
              {formatIDR(product.discountPrice ?? product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatIDR(product.price)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
