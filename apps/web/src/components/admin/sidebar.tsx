'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  BadgeCheck,
  Ticket,
  Users,
  FileText,
  Image as ImageIcon,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/categories', label: 'Kategori', icon: FolderTree },
  { href: '/admin/orders', label: 'Order', icon: ShoppingCart },
  { href: '/admin/payments', label: 'Pembayaran', icon: BadgeCheck },
  { href: '/admin/coupons', label: 'Kupon', icon: Ticket },
  { href: '/admin/users', label: 'User', icon: Users },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/content', label: 'Konten', icon: ImageIcon },
  { href: '/admin/settings', label: 'Setting', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
      <div className="flex h-16 items-center gap-2 border-b px-6 font-bold">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        Admin
      </div>
      <nav className="space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
