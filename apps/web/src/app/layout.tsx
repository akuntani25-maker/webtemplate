import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DigiTemplate — Marketplace Template Digital',
    template: '%s | DigiTemplate',
  },
  description:
    'Marketplace template digital: website, spreadsheet, Excel, Notion, Canva, invoice, dashboard, dan lainnya. Cepat, profesional, siap pakai.',
  keywords: [
    'template website',
    'template excel',
    'template notion',
    'template canva',
    'template invoice',
    'marketplace digital',
  ],
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
