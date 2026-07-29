'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminQuery, useAdminMutation } from '@/lib/admin-api';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [name, setName] = useState('');
  const q = useAdminQuery<Category[]>(['admin', 'categories'], '/admin/categories');
  const create = useAdminMutation({
    method: 'post',
    path: () => '/admin/categories',
    body: (v: { name: string }) => v,
    invalidate: [['admin', 'categories']],
  });
  const del = useAdminMutation({
    method: 'delete',
    path: (id: string) => `/admin/categories/${id}`,
    invalidate: [['admin', 'categories']],
  });

  const items = q.data?.data ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Kategori</h2>

      <Card>
        <CardContent className="flex gap-2 p-4">
          <Input
            placeholder="Nama kategori baru"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            disabled={!name || create.isPending}
            onClick={() =>
              create.mutate({ name }, { onSuccess: () => setName('') })
            }
          >
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Nama</TH>
                <TH>Slug</TH>
                <TH>Produk</TH>
                <TH>Status</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium">{c.name}</TD>
                  <TD className="font-mono text-muted-foreground">{c.slug}</TD>
                  <TD>{c._count?.products ?? 0}</TD>
                  <TD>
                    <Badge variant={c.isActive ? 'success' : 'muted'}>
                      {c.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Hapus "${c.name}"?`))
                          del.mutate(c.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TD>
                </TR>
              ))}
              {items.length === 0 && (
                <TR>
                  <TD className="py-10 text-center text-muted-foreground" colSpan={5}>
                    {q.isLoading ? 'Memuat…' : 'Belum ada kategori.'}
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
