'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, GitBranch, DollarSign, BarChart2, Settings, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/pipeline', icon: GitBranch, label: 'Pipeline' },
  { href: '/dashboard/finance', icon: DollarSign, label: 'Finance' },
  { href: '/dashboard/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/dashboard/reports', icon: BarChart2, label: 'Reports' },
];

function FestowebIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 384 384"
      width={size}
      height={size}
      aria-label="Festoweb"
    >
      <path
        fill="#3dcf8e"
        fillRule="nonzero"
        d="M239.523 35.879c1.809-7.238-1.625-14.765-8.277-18.144-6.657-3.379-14.758-1.711-19.539 4.023L51.707 213.758c-3.973 4.77-4.829 11.407-2.196 17.031C52.144 236.406 57.793 240 64 240h107.508l-27.031 108.121c-1.809 7.238 1.624 14.765 8.28 18.144 6.653 3.379 14.758 1.711 19.535-4.023l160-192c3.973-4.77 4.832-11.406 2.196-17.027C331.855 147.59 326.207 144 320 144H212.492Z"
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-surface border-r border-border h-screen flex flex-col sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#121212] flex items-center justify-center shrink-0">
            <FestowebIcon size={20} />
          </div>
          <div>
            <p className="text-text-primary font-bold text-sm leading-none">Festoweb</p>
            <p className="text-text-faint text-xs mt-0.5">CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface2'
              )}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-border">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/dashboard/settings'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-text-muted hover:text-text-primary hover:bg-surface2'
          )}
        >
          <Settings size={15} /> Settings
        </Link>
      </div>
    </aside>
  );
}
