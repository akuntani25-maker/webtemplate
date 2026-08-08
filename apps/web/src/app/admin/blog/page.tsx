import { Card, CardContent } from '@/components/ui/card';

export default function AdminBlogPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Blog</h2>
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Modul Blog (Tahap 10) menyusul. Skema database (BlogPost,
          BlogCategory, BlogTag, BlogComment) sudah tersedia; CRUD admin
          mengikuti pola yang sama dengan modul Produk.
        </CardContent>
      </Card>
    </div>
  );
}
