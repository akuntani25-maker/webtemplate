'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, ShoppingBag, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';

interface Order {
  id: string;
  number: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  invoice?: { status: string };
  _count?: { items: number };
}
interface License {
  id: string;
  product: { name: string; slug: string };
  remaining: number;
  maxDownloads: number;
  downloadCount: number;
}

const VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = {
  PAID: 'success',
  WAITING_PAYMENT: 'warning',
  EXPIRED: 'danger',
  CANCELLED: 'danger',
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<'orders' | 'downloads'>('orders');

  const orders = useQuery({
    queryKey: ['me', 'orders'],
    queryFn: async (): Promise<Order[]> => (await api.get('/orders')).data.data,
    enabled: !!user,
  });
  const licenses = useQuery({
    queryKey: ['me', 'downloads'],
    queryFn: async (): Promise<License[]> =>
      (await api.get('/downloads')).data.data,
    enabled: !!user,
  });

  async function downloadLicense(licenseId: string) {
    try {
      const filesRes = await api.get(`/downloads/${licenseId}/files`);
      const files = filesRes.data.data.files as { id: string }[];
      if (files.length === 0) return alert('Belum ada file.');
      const sign = await api.post(
        `/downloads/${licenseId}/files/${files[0].id}/sign`,
      );
      window.open(sign.data.data.url, '_blank');
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Gagal membuat tautan unduh');
    }
  }

  async function logout() {
    await api.post('/auth/logout');
    window.location.href = '/';
  }

  if (isLoading) return <div className="container py-20">Memuat…</div>;
  if (!user)
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Silakan login terlebih dahulu.</p>
        <Button asChild className="mt-4">
          <Link href="/login?redirect=/dashboard">Masuk</Link>
        </Button>
      </div>
    );

  return (
    <div className="container space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Halo, {user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" /> Keluar
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={tab === 'orders' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('orders')}
        >
          <ShoppingBag className="h-4 w-4" /> Pesanan
        </Button>
        <Button
          variant={tab === 'downloads' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('downloads')}
        >
          <Download className="h-4 w-4" /> Unduhan
        </Button>
      </div>

      {tab === 'orders' && (
        <div className="space-y-3">
          {(orders.data ?? []).map((o) => (
            <Card key={o.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <Link
                    href={`/invoice/PAY-${o.number.slice(4)}`}
                    className="font-mono font-medium hover:text-primary"
                  >
                    {o.number}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {o._count?.items ?? 0} item ·{' '}
                    {new Date(o.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatIDR(o.grandTotal)}</p>
                  <Badge variant={VARIANT[o.status] ?? 'muted'}>
                    {o.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {(orders.data ?? []).length === 0 && (
            <p className="text-muted-foreground">Belum ada pesanan.</p>
          )}
        </div>
      )}

      {tab === 'downloads' && (
        <div className="grid gap-3 md:grid-cols-2">
          {(licenses.data ?? []).map((l) => (
            <Card key={l.id}>
              <CardHeader>
                <CardTitle className="text-base">{l.product.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Sisa kuota: {l.remaining}/{l.maxDownloads}
                </p>
                <Button
                  size="sm"
                  disabled={l.remaining <= 0}
                  onClick={() => downloadLicense(l.id)}
                >
                  <Download className="h-4 w-4" /> Unduh
                </Button>
              </CardContent>
            </Card>
          ))}
          {(licenses.data ?? []).length === 0 && (
            <p className="text-muted-foreground">
              Belum ada file. Selesaikan pembayaran untuk membuka unduhan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
