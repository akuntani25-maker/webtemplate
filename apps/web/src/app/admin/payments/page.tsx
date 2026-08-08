'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useAdminQuery, useAdminMutation } from '@/lib/admin-api';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';

interface Proof {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  senderName?: string | null;
  amount?: number | null;
  createdAt: string;
  invoice: {
    number: string;
    order: {
      number: string;
      grandTotal: number;
      customerName: string;
      customerEmail: string;
    };
  };
}

const STATUS_VARIANT = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
} as const;

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState('PENDING');
  const key = ['admin', 'payments', status];
  const q = useAdminQuery<Proof[]>(key, `/admin/payments?status=${status}`);

  const approve = useAdminMutation({
    method: 'post',
    path: (id: string) => `/admin/payments/${id}/approve`,
    invalidate: [
      ['admin', 'payments'],
      ['admin', 'overview'],
    ],
  });
  const reject = useAdminMutation({
    method: 'post',
    path: (v: { id: string; reason: string }) =>
      `/admin/payments/${v.id}/reject`,
    body: (v) => ({ reason: v.reason }),
    invalidate: [['admin', 'payments']],
  });

  const proofs = q.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Verifikasi Pembayaran</h2>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? 'default' : 'outline'}
              onClick={() => setStatus(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Order</TH>
                <TH>Pelanggan</TH>
                <TH>Nominal</TH>
                <TH>Pengirim</TH>
                <TH>Status</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {proofs.map((p) => (
                <TR key={p.id}>
                  <TD className="font-mono">{p.invoice.order.number}</TD>
                  <TD>
                    <div>{p.invoice.order.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.invoice.order.customerEmail}
                    </div>
                  </TD>
                  <TD>{formatIDR(p.invoice.order.grandTotal)}</TD>
                  <TD>{p.senderName ?? '—'}</TD>
                  <TD>
                    <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                  </TD>
                  <TD className="text-right">
                    {p.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={approve.isPending}
                          onClick={() => approve.mutate(p.id)}
                        >
                          <Check className="h-4 w-4" /> Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason =
                              window.prompt('Alasan penolakan?') ?? '';
                            if (reason) reject.mutate({ id: p.id, reason });
                          }}
                        >
                          <X className="h-4 w-4" /> Tolak
                        </Button>
                      </div>
                    )}
                  </TD>
                </TR>
              ))}
              {proofs.length === 0 && (
                <TR>
                  <TD
                    className="py-10 text-center text-muted-foreground"
                    colSpan={6}
                  >
                    {q.isLoading ? 'Memuat…' : 'Tidak ada data.'}
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
