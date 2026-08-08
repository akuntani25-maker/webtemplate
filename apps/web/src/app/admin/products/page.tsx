'use client';

import Link from 'next/link';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useAdminQuery, useAdminMutation } from '@/lib/admin-api';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  purchaseCount: number;
  category?: { name: string };
  _count?: { files: number; orderItems: number };
}

const STATUS_VARIANT = {
  DRAFT: 'muted',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
} as const;

export default function AdminProductsPage() {
  const q = useAdminQuery<AdminProduct[]>(
    ['admin', 'products'],
    '/admin/products?limit=50',
  );
  const del = useAdminMutation({
    method: 'delete',
    path: (id: string) => `/admin/products/${id}`,
    invalidate: [['admin', 'products']],
  });

  const items = q.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Produk</h2>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" /> Tambah Produk
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Nama</TH>
                <TH>Kategori</TH>
                <TH>Harga</TH>
                <TH>Terjual</TH>
                <TH>File</TH>
                <TH>Status</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium">{p.name}</TD>
                  <TD className="text-muted-foreground">
                    {p.category?.name ?? '—'}
                  </TD>
                  <TD>{formatIDR(p.discountPrice ?? p.price)}</TD>
                  <TD>{p.purchaseCount}</TD>
                  <TD>{p._count?.files ?? 0}</TD>
                  <TD>
                    <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="icon" variant="ghost">
                        <Link href={`/admin/products/${p.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm(`Hapus "${p.name}"?`))
                            del.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
              {items.length === 0 && (
                <TR>
                  <TD
                    className="py-10 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    {q.isLoading ? 'Memuat…' : 'Belum ada produk.'}
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
