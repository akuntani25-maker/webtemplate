'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, ShoppingBag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span>DigiTemplate</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/kategori" className="hover:text-primary">
            Kategori
          </Link>
          <Link href="/produk" className="hover:text-primary">
            Produk
          </Link>
          <Link href="/blog" className="hover:text-primary">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Cari">
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ganti tema"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="hidden h-5 w-5 dark:block" />
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Masuk</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
