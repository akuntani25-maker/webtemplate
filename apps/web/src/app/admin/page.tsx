'use client';

import {
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  Package,
  Clock,
} from 'lucide-react';
import { useAdminQuery } from '@/lib/admin-api';
import { StatCard } from '@/components/admin/stat-card';
import { SalesChart } from '@/components/admin/sales-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';

interface Overview {
  revenueTotal: number;
  revenueThisMonth: number;
  paidOrders: number;
  pendingPayments: number;
  totalUsers: number;
  newUsersThisMonth: number;
  publishedProducts: number;
  totalDownloads: number;
}
interface TopProduct {
  id: string;
  name: string;
  purchaseCount: number;
  downloadCount: number;
  price: number;
}

export default function AdminDashboard() {
  const overview = useAdminQuery<Overview>(
    ['admin', 'overview'],
    '/admin/stats/overview',
  );
  const sales = useAdminQuery<{ date: string; revenue: number; orders: number }[]>(
    ['admin', 'sales'],
    '/admin/stats/sales?range=30',
  );
  const top = useAdminQuery<TopProduct[]>(
    ['admin', 'top'],
    '/admin/stats/top-products?limit=5',
  );

  const o = overview.data?.data;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {overview.isError && (
        <p className="text-sm text-red-500">
          Gagal memuat data. Pastikan Anda login sebagai admin & API berjalan.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue Total"
          value={formatIDR(o?.revenueTotal ?? 0)}
          icon={DollarSign}
          hint={`Bulan ini: ${formatIDR(o?.revenueThisMonth ?? 0)}`}
        />
        <StatCard
          label="Order Dibayar"
          value={String(o?.paidOrders ?? 0)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={String(o?.pendingPayments ?? 0)}
          icon={Clock}
        />
        <StatCard
          label="Total Download"
          value={String(o?.totalDownloads ?? 0)}
          icon={Download}
        />
        <StatCard
          label="User"
          value={String(o?.totalUsers ?? 0)}
          icon={Users}
          hint={`Baru: ${o?.newUsersThisMonth ?? 0}`}
        />
        <StatCard
          label="Produk Tayang"
          value={String(o?.publishedProducts ?? 0)}
          icon={Package}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Penjualan 30 Hari</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={sales.data?.data ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(top.data?.data ?? []).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-muted-foreground">
                  {i + 1}.
                </span>
                <span className="flex-1 truncate">{p.name}</span>
                <span className="font-medium">{p.purchaseCount}×</span>
              </div>
            ))}
            {(top.data?.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
