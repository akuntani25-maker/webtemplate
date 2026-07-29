'use client';

import { useAdminQuery } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminContentPage() {
  const banners = useAdminQuery<{ id: string; title: string }[]>(
    ['admin', 'banners'],
    '/admin/banners',
  );
  const testimonials = useAdminQuery<{ id: string; authorName: string }[]>(
    ['admin', 'testimonials'],
    '/admin/testimonials',
  );
  const faqs = useAdminQuery<{ id: string; question: string }[]>(
    ['admin', 'faqs'],
    '/admin/faqs',
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Konten</h2>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(banners.data?.data ?? []).map((b) => (
              <div key={b.id}>{b.title}</div>
            ))}
            {(banners.data?.data ?? []).length === 0 && (
              <p className="text-muted-foreground">Belum ada.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Testimoni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(testimonials.data?.data ?? []).map((t) => (
              <div key={t.id}>{t.authorName}</div>
            ))}
            {(testimonials.data?.data ?? []).length === 0 && (
              <p className="text-muted-foreground">Belum ada.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(faqs.data?.data ?? []).map((f) => (
              <div key={f.id}>{f.question}</div>
            ))}
            {(faqs.data?.data ?? []).length === 0 && (
              <p className="text-muted-foreground">Belum ada.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
