'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="container grid gap-8 py-20 md:grid-cols-2 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-center"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
            <Sparkles className="h-4 w-4" /> Template digital premium
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Template digital siap pakai untuk{' '}
            <span className="text-primary">bisnis & produktivitas</span>
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Website, spreadsheet, Notion, Canva, invoice, dashboard, dan banyak
            lagi. Beli sekali, unduh instan, langsung produktif.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/produk">
                Jelajahi Produk <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/kategori">Lihat Kategori</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative hidden md:block"
        >
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-xl border bg-gradient-to-br from-primary/10 to-accent"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
