import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin/sidebar';

export const metadata: Metadata = {
  title: 'Admin — DigiTemplate',
  robots: { index: false, follow: false },
};

/**
 * Layout admin (nested di bawah root layout: html/body/Providers dari root).
 * Tanpa header/footer publik. Proteksi akses ditegakkan di API (@Roles('ADMIN'));
 * redirect UX bisa ditambahkan via middleware.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-sm font-medium text-muted-foreground">
            Panel Administrasi
          </h1>
          <span className="text-sm text-muted-foreground">Admin</span>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
