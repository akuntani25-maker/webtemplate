'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAdminQuery } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  categoryId: z.string().min(1, 'Pilih kategori'),
  shortDesc: z.string().optional(),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  price: z.coerce.number().int().min(0),
  discountPrice: z.coerce.number().int().min(0).optional().or(z.literal(0)),
  // Tanpa .default() agar tipe input == output (syarat resolver v5);
  // nilai awal disuplai lewat defaultValues di useForm.
  demoType: z.string(),
  demoUrl: z.string().url('URL tidak valid').optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

type FormValues = z.infer<typeof schema>;

interface Category {
  id: string;
  name: string;
}

export function ProductForm({
  productId,
  defaults,
}: {
  productId?: string;
  defaults?: Partial<FormValues>;
}) {
  const router = useRouter();
  const categories = useAdminQuery<Category[]>(
    ['admin', 'categories'],
    '/admin/categories',
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      demoType: 'OTHER',
      status: 'DRAFT',
      price: 0,
      ...defaults,
    },
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      demoUrl: values.demoUrl || undefined,
      discountPrice: values.discountPrice || undefined,
    };
    if (productId) {
      await api.patch(`/admin/products/${productId}`, payload);
    } else {
      await api.post('/admin/products', payload);
    }
    router.push('/admin/products');
    router.refresh();
  }

  const cats = categories.data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{productId ? 'Edit Produk' : 'Produk Baru'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nama" error={errors.name?.message}>
            <Input {...register('name')} placeholder="Nama produk" />
          </Field>

          <Field label="Kategori" error={errors.categoryId?.message}>
            <select
              {...register('categoryId')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— pilih —</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Deskripsi singkat">
            <Input {...register('shortDesc')} />
          </Field>

          <Field label="Deskripsi" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={5}
              className="w-full rounded-md border border-input bg-background p-3 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Harga (Rp)" error={errors.price?.message}>
              <Input type="number" {...register('price')} />
            </Field>
            <Field label="Harga diskon (Rp)">
              <Input type="number" {...register('discountPrice')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipe demo">
              <select
                {...register('demoType')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {[
                  'WEBSITE',
                  'SPREADSHEET',
                  'EXCEL',
                  'CANVA',
                  'NOTION',
                  'PDF',
                  'IMAGE',
                  'OTHER',
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="URL demo" error={errors.demoUrl?.message}>
              <Input {...register('demoUrl')} placeholder="https://…" />
            </Field>
          </div>

          <Field label="Status">
            <select
              {...register('status')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </Field>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan…' : 'Simpan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/products')}
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
