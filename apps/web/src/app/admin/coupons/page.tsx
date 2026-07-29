'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminQuery, useAdminMutation } from '@/lib/admin-api';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  usedCount: number;
  usageLimit?: number | null;
  isActive: boolean;
  expiresAt?: string | null;
}

export default function AdminCouponsPage() {
  const [form, setForm] = useState({ code: '', type: 'PERCENT', value: 10 });
  const q = useAdminQuery<Coupon[]>(['admin', 'coupons'], '/admin/coupons');
  const create = useAdminMutation({
    method: 'post',
    path: () => '/admin/coupons',
    body: (v: typeof form) => ({ ...v, value: Number(v.value) }),
    invalidate: [['admin', 'coupons']],
  });
  const del = useAdminMutation({
    method: 'delete',
    path: (id: string) => `/admin/coupons/${id}`,
    invalidate: [['admin', 'coupons']],
  });

  const items = q.data?.data ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Kupon</h2>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <label className="text-xs">Kode</label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="HEMAT20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs">Tipe</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="PERCENT">PERSEN</option>
              <option value="FIXED">NOMINAL</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs">Nilai</label>
            <Input
              type="number"
              value={form.value}
              onChange={(e) =>
                setForm({ ...form, value: Number(e.target.value) })
              }
            />
          </div>
          <Button
            disabled={!form.code || create.isPending}
            onClick={() =>
              create.mutate(form, {
                onSuccess: () =>
                  setForm({ code: '', type: 'PERCENT', value: 10 }),
              })
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
                <TH>Kode</TH>
                <TH>Tipe</TH>
                <TH>Nilai</TH>
                <TH>Dipakai</TH>
                <TH>Status</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((c) => (
                <TR key={c.id}>
                  <TD className="font-mono font-medium">{c.code}</TD>
                  <TD>{c.type}</TD>
                  <TD>
                    {c.type === 'PERCENT' ? `${c.value}%` : `Rp ${c.value.toLocaleString('id-ID')}`}
                  </TD>
                  <TD>
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </TD>
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
                        if (window.confirm(`Hapus kupon ${c.code}?`))
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
                  <TD className="py-10 text-center text-muted-foreground" colSpan={6}>
                    {q.isLoading ? 'Memuat…' : 'Belum ada kupon.'}
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
