'use client';

import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';

interface Invoice {
  number: string;
  status: string;
  amount: number;
  paymentMethod: string;
  expiresAt: string;
  paymentInstructions?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
  order: { number: string; customerName: string };
  proofs: { id: string; status: string; createdAt: string }[];
}

export default function InvoicePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = use(params);
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [sender, setSender] = useState('');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const q = useQuery({
    queryKey: ['invoice', number],
    queryFn: async (): Promise<Invoice> => {
      const res = await api.get(`/invoices/${number}`);
      return res.data.data;
    },
  });

  const invoice = q.data;

  async function upload() {
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      // 1) minta presigned URL
      const presign = await api.post(`/invoices/${number}/proof/presign`, {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
      });
      const { uploadUrl, storageKey } = presign.data.data;

      // 2) upload langsung ke R2
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      // 3) daftarkan bukti
      await api.post(`/invoices/${number}/proof`, {
        storageKey,
        senderName: sender || undefined,
      });

      setMsg('Bukti transfer berhasil diunggah. Menunggu verifikasi admin.');
      setFile(null);
      qc.invalidateQueries({ queryKey: ['invoice', number] });
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? 'Gagal mengunggah bukti');
    } finally {
      setUploading(false);
    }
  }

  if (q.isLoading) return <div className="container py-20">Memuat…</div>;
  if (!invoice)
    return (
      <div className="container py-20 text-center text-muted-foreground">
        Invoice tidak ditemukan. Pastikan Anda login dengan akun pemesan.
      </div>
    );

  const isPaid = invoice.status === 'PAID';
  const inst = invoice.paymentInstructions;

  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoice {invoice.order.number}</h1>
        <Badge
          variant={
            isPaid
              ? 'success'
              : invoice.status === 'EXPIRED'
                ? 'danger'
                : 'warning'
          }
        >
          {invoice.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {formatIDR(invoice.amount)}
          </p>
          {inst && (
            <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium">Transfer ke:</p>
              <p>
                {inst.bankName} — <b>{inst.accountNumber}</b>
              </p>
              <p className="text-muted-foreground">a.n. {inst.accountHolder}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isPaid ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="font-medium">Pembayaran terverifikasi</p>
              <p className="text-sm text-muted-foreground">
                File Anda siap diunduh di dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unggah Bukti Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Nama pengirim (opsional)"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
            />
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={upload} disabled={!file || uploading}>
              <UploadCloud className="h-4 w-4" />
              {uploading ? 'Mengunggah…' : 'Unggah Bukti'}
            </Button>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          </CardContent>
        </Card>
      )}

      {invoice.proofs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Bukti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invoice.proofs.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(p.createdAt).toLocaleString('id-ID')}</span>
                <Badge
                  variant={
                    p.status === 'APPROVED'
                      ? 'success'
                      : p.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {p.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
