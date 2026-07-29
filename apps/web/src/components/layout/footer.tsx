import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Produk',
    links: [
      ['Template Website', '/kategori/template-website'],
      ['Template Excel', '/kategori/template-excel'],
      ['Template Notion', '/kategori/template-notion'],
      ['Template Canva', '/kategori/template-canva'],
    ],
  },
  {
    title: 'Perusahaan',
    links: [
      ['Tentang', '/tentang'],
      ['Blog', '/blog'],
      ['Kontak', '/kontak'],
    ],
  },
  {
    title: 'Bantuan',
    links: [
      ['FAQ', '/faq'],
      ['Cara Membeli', '/cara-membeli'],
      ['Kebijakan Privasi', '/privasi'],
      ['Syarat & Ketentuan', '/syarat'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div>
          <h3 className="font-bold text-lg">DigiTemplate</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Marketplace template digital profesional untuk mempercepat kerja
            dan bisnis Anda.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold">{col.title}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DigiTemplate. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  );
}
