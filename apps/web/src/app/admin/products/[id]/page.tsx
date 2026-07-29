'use client';

import { use } from 'react';
import { useAdminQuery } from '@/lib/admin-api';
import { ProductForm } from '@/components/admin/product-form';

interface ProductDetail {
  id: string;
  name: string;
  categoryId: string;
  shortDesc?: string | null;
  description: string;
  price: number;
  discountPrice?: number | null;
  demoType: string;
  demoUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const q = useAdminQuery<ProductDetail>(['admin', 'product', id], `/admin/products/${id}`);
  const p = q.data?.data;

  if (q.isLoading) return <p className="text-muted-foreground">Memuat…</p>;
  if (!p) return <p className="text-red-500">Produk tidak ditemukan.</p>;

  return (
    <ProductForm
      productId={id}
      defaults={{
        name: p.name,
        categoryId: p.categoryId,
        shortDesc: p.shortDesc ?? undefined,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice ?? 0,
        demoType: p.demoType,
        demoUrl: p.demoUrl ?? '',
        status: p.status,
      }}
    />
  );
}
