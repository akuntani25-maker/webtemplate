'use client';

import { useAdminQuery } from '@/lib/admin-api';
import { Card, CardContent } from '@/components/ui/card';

interface Setting {
  id: string;
  key: string;
  group: string;
  value: unknown;
}

export default function AdminSettingsPage() {
  const q = useAdminQuery<Setting[]>(['admin', 'settings'], '/admin/settings');
  const items = q.data?.data ?? [];
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Pengaturan Situs</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">
                {s.group}
              </p>
              <p className="font-mono font-medium">{s.key}</p>
              <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(s.value, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-muted-foreground">
            {q.isLoading ? 'Memuat…' : 'Belum ada pengaturan.'}
          </p>
        )}
      </div>
    </div>
  );
}
