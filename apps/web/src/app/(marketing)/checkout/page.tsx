'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Tag } from 'lucide-react';
import { api } from '@/lib/api';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';

const METHODS = [
  'MANUAL_TRANSFER',
  'BANK_TRANSFER',
  'QRIS',
  'GOPAY',
  'OVO',
  'DANA',
  'SHOPEEPAY',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, remove, subtotal, clear } = useCart();
  const { user } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [method, setMethod] = useState('MANUAL_TRANSFER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const grandTotal = Math.max(0, subtotal - discount);

  async function applyCoupon() {
    setCouponMsg('');
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode,
        subtotal,
      });
      setDiscount(res.data.data.discount);
      setCouponMsg(`Diskon ${formatIDR(res.data.data.discount)} diterapkan`);
    } catch (err: any) {
      setDiscount(0);
      setCouponMsg(err?.response?.data?.message ?? 'Kupon tidak valid');
    }
  }

  async function submit() {
    setError('');
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/orders/checkout', {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        couponCode: couponCode || undefined,
        customerName: name || user.name,
        customerEmail: email || user.email,
        paymentMethod: method,
      });
      const order = res.data.data;
      clear();
      router.push(`/invoice/${order.invoice.number}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Checkout gagal'));
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Keranjang Anda kosong.</p>
        <Button asChild className="mt-4">
          <Link href="/produk">Jelajahi Produk</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <h1 className="text-2xl font-bold">Checkout</h1>
        {items.map((i) => (
          <Card key={i.productId}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 rounded bg-muted" />
              <div className="flex-1">
                <p className="font-medium">{i.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatIDR(i.price)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(i.productId)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Pembeli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={user ? `Nama (${user.name})` : 'Nama'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="email"
              placeholder={user ? `Email (${user.email})` : 'Email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Kode kupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <Button variant="outline" onClick={applyCoupon}>
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {couponMsg && (
              <p className="text-xs text-muted-foreground">{couponMsg}</p>
            )}

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Diskon</span>
                <span>-{formatIDR(discount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Total</span>
                <span className="text-primary">{formatIDR(grandTotal)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Metode Pembayaran</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" onClick={submit} disabled={loading}>
              {loading ? 'Memproses…' : 'Buat Pesanan'}
            </Button>
            {!user && (
              <p className="text-center text-xs text-muted-foreground">
                Anda akan diminta login untuk menyelesaikan pesanan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
