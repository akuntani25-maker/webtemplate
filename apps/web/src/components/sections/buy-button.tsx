'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';

export function BuyButton({
  product,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    thumbnailUrl?: string | null;
  };
}) {
  const router = useRouter();
  const { add, items } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = items.some((i) => i.productId === product.id);

  function buyNow() {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.discountPrice ?? product.price,
      thumbnailUrl: product.thumbnailUrl,
    });
    router.push('/checkout');
  }

  function addToCart() {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.discountPrice ?? product.price,
      thumbnailUrl: product.thumbnailUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex gap-3">
      <Button size="lg" onClick={buyNow}>
        Beli Sekarang
      </Button>
      <Button size="lg" variant="outline" onClick={addToCart}>
        {added || inCart ? (
          <>
            <Check className="h-4 w-4" /> Di Keranjang
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" /> Keranjang
          </>
        )}
      </Button>
    </div>
  );
}
