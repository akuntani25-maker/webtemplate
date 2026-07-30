'use client';

import { useCallback, useSyncExternalStore } from 'react';

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
const EMPTY: CartItem[] = [];

/**
 * Cache snapshot agar `getSnapshot` mengembalikan referensi stabil.
 * Tanpa ini, JSON.parse membuat array baru setiap render → render tak berujung.
 */
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

function getSnapshot(): CartItem[] {
  const raw = localStorage.getItem(KEY) ?? '[]';
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = JSON.parse(raw);
      cachedItems = Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      cachedItems = EMPTY;
    }
  }
  return cachedItems;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  // Sinkron antar tab
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function write(items: CartItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Keranjang berbasis localStorage (produk digital → qty 1 default),
 * dibaca lewat useSyncExternalStore agar konsisten & aman saat SSR.
 */
export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((item: Omit<CartItem, 'quantity'>) => {
    const current = getSnapshot();
    if (current.some((i) => i.productId === item.productId)) return;
    write([...current, { ...item, quantity: 1 }]);
  }, []);

  const remove = useCallback((productId: string) => {
    write(getSnapshot().filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return { items, add, remove, clear, subtotal };
}
