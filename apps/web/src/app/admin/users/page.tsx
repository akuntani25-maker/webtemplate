'use client';

import { useAdminQuery, useAdminMutation } from '@/lib/admin-api';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  _count?: { orders: number };
}

export default function AdminUsersPage() {
  const q = useAdminQuery<AdminUser[]>(
    ['admin', 'users'],
    '/admin/users?limit=50',
  );
  const update = useAdminMutation({
    method: 'patch',
    path: (v: { id: string; role: string }) => `/admin/users/${v.id}`,
    body: (v) => ({ role: v.role }),
    invalidate: [['admin', 'users']],
  });

  const items = q.data?.data ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Nama</TH>
                <TH>Email</TH>
                <TH>Order</TH>
                <TH>Role</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium">{u.name}</TD>
                  <TD className="text-muted-foreground">{u.email}</TD>
                  <TD>{u._count?.orders ?? 0}</TD>
                  <TD>
                    <Badge variant={u.role === 'ADMIN' ? 'default' : 'muted'}>
                      {u.role}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate({
                          id: u.id,
                          role: u.role === 'ADMIN' ? 'USER' : 'ADMIN',
                        })
                      }
                    >
                      Jadikan {u.role === 'ADMIN' ? 'USER' : 'ADMIN'}
                    </Button>
                  </TD>
                </TR>
              ))}
              {items.length === 0 && (
                <TR>
                  <TD
                    className="py-10 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    {q.isLoading ? 'Memuat…' : 'Belum ada user.'}
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
