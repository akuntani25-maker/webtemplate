import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/api';
import { buildMetadata, productJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { formatIDR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

export const revalidate = 300;

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await serverFetch<Product>(`/products/${slug}`, {
      revalidate: 300,
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Produk tidak ditemukan' };
  return buildMetadata({
    title: product.metaTitle ?? product.name,
    description:
      product.metaDescription ??
      product.shortDesc ??
      product.description.slice(0, 160),
    path: `/produk/${product.slug}`,
    image: product.thumbnailUrl ?? undefined,
  });
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const jsonLd = productJsonLd(product);
  const crumbs = breadcrumbJsonLd([
    { name: 'Beranda', path: '/' },
    { name: 'Produk', path: '/produk' },
    { name: product.name, path: `/produk/${product.slug}` },
  ]);

  return (
    <article className="container py-10">
      {/* JSON-LD untuk SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
          {product.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            {product.category?.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.shortDesc}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatIDR(product.discountPrice ?? product.price)}
            </span>
            {product.discountPrice != null && (
              <span className="text-muted-foreground line-through">
                {formatIDR(product.price)}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg">Beli Sekarang</Button>
            {product.demoUrl && (
              <Button asChild size="lg" variant="outline">
                <a href={product.demoUrl} target="_blank" rel="noreferrer">
                  Live Demo
                </a>
              </Button>
            )}
          </div>

          {product.features.length > 0 && (
            <ul className="mt-8 space-y-2 text-sm">
              {product.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="prose prose-neutral mt-12 max-w-none dark:prose-invert">
        <h2>Deskripsi</h2>
        <p>{product.description}</p>
      </section>
    </article>
  );
}
