'use client';

import { useCallback, useEffect, useState } from 'react';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number; // harga efektif (setelah diskon produk)
  thumbnailUrl?: string | null;
  quantity: number;
}

const KEY = 'digitemplate.cart';
const EVENT = 'cart:changed';

function read(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Keranjang sederhana berbasis localStorage (produk digital → qty 1 default).
 * Cukup untuk MVP tanpa server-side cart.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const handler = () => setItems(read());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const add = useCallback((item: Omit<CartItem, 'quantity'>) => {
    const current = read();
    if (current.find((i) => i.productId === item.productId)) return;
    write([...current, { ...item, quantity: 1 }]);
  }, []);

  const remove = useCallback((productId: string) => {
    write(read().filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return { items, add, remove, clear, subtotal };
}
