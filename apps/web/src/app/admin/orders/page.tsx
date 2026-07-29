'use client';

import { useAdminQuery } from '@/lib/admin-api';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';

interface Order {
  id: string;
  number: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  user?: { name: string; email: string };
  invoice?: { status: string; paymentMethod: string };
  _count?: { items: number };
}

const VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = {
  PAID: 'success',
  WAITING_PAYMENT: 'warning',
  PENDING: 'muted',
  EXPIRED: 'danger',
  CANCELLED: 'danger',
  REFUNDED: 'muted',
};

export default function AdminOrdersPage() {
  const q = useAdminQuery<Order[]>(['admin', 'orders'], '/admin/orders?limit=50');
  const items = q.data?.data ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Nomor</TH>
                <TH>Pelanggan</TH>
                <TH>Item</TH>
                <TH>Total</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((o) => (
                <TR key={o.id}>
                  <TD className="font-mono">{o.number}</TD>
                  <TD>{o.user?.name ?? '—'}</TD>
                  <TD>{o._count?.items ?? 0}</TD>
                  <TD>{formatIDR(o.grandTotal)}</TD>
                  <TD>
                    <Badge variant={VARIANT[o.status] ?? 'muted'}>
                      {o.status}
                    </Badge>
                  </TD>
                </TR>
              ))}
              {items.length === 0 && (
                <TR>
                  <TD className="py-10 text-center text-muted-foreground" colSpan={5}>
                    {q.isLoading ? 'Memuat…' : 'Belum ada order.'}
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
