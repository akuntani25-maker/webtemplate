'use client';

import { formatIDR } from '@/lib/utils';

interface Point {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Grafik batang ringan (tanpa dependency chart eksternal) — aman untuk CSP.
 */
export function SalesChart({ data }: { data: Point[] }) {
  if (!data || data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Belum ada data penjualan.
      </p>
    );
  }
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex h-56 items-end gap-1">
      {data.map((d) => (
        <div
          key={d.date}
          className="group flex flex-1 flex-col items-center justify-end"
          title={`${d.date}: ${formatIDR(d.revenue)} (${d.orders} order)`}
        >
          <div
            className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
            style={{ height: `${(d.revenue / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
