'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, GitBranch, DollarSign,
  BarChart2, Settings, CreditCard,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients',       icon: Users,           label: 'Clients' },
  { href: '/dashboard/pipeline',      icon: GitBranch,       label: 'Pipeline' },
  { href: '/dashboard/finance',       icon: DollarSign,      label: 'Finance' },
  { href: '/dashboard/subscriptions', icon: CreditCard,      label: 'Subscriptions' },
  { href: '/dashboard/reports',       icon: BarChart2,       label: 'Reports' },
];

function FestowebIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384" width={size} height={size} aria-hidden="true">
      <path
        fill="#3dcf8e"
        fillRule="nonzero"
        d="M239.523 35.879c1.809-7.238-1.625-14.765-8.277-18.144-6.657-3.379-14.758-1.711-19.539 4.023L51.707 213.758c-3.973 4.77-4.829 11.407-2.196 17.031C52.144 236.406 57.793 240 64 240h107.508l-27.031 108.121c-1.809 7.238 1.624 14.765 8.28 18.144 6.653 3.379 14.758 1.711 19.535-4.023l160-192c3.973-4.77 4.832-11.406 2.196-17.027C331.855 147.59 326.207 144 320 144H212.492Z"
      />
    </svg>
  );
}

function NavItem({
  href, icon: Icon, label, active,
}: {
  href: string; icon: React.ElementType; label: string; active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        fontSize: 13.5,
        fontWeight: active ? 600 : 400,
        color: active ? '#eef2ff' : 'rgba(255,255,255,0.38)',
        background: active ? 'rgba(124,111,247,0.1)' : 'transparent',
        borderLeft: `2px solid ${active ? '#7c6ff7' : 'transparent'}`,
        transition: 'color 0.15s, background 0.15s, border-color 0.15s',
        letterSpacing: '-0.01em',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = 'rgba(255,255,255,0.38)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <Icon size={15} color={active ? '#a89ff9' : 'currentColor'} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {active && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#7c6ff7',
          boxShadow: '0 0 8px rgba(124,111,247,0.9)',
          flexShrink: 0,
        }} />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 232,
      background: 'rgba(7, 9, 14, 0.97)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(124,111,247,0.18), rgba(6,214,160,0.1))',
            border: '1px solid rgba(124,111,247,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FestowebIcon size={20} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#eef2ff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Festoweb
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
              CRM Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        <p style={{
          fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.16)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '8px 12px 6px', marginBottom: 2, fontFamily: 'var(--font-body)',
        }}>
          Workspace
        </p>

        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={active} />;
        })}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '10px 4px' }} />

        <p style={{
          fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.16)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '4px 12px 6px', fontFamily: 'var(--font-body)',
        }}>
          System
        </p>
        <NavItem href="/dashboard/settings" icon={Settings} label="Settings" active={pathname === '/dashboard/settings'} />
      </nav>

      {/* User profile */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c6ff7 0%, #06d6a0 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 12, fontWeight: 700,
          fontFamily: 'var(--font-display)', flexShrink: 0,
          boxShadow: '0 0 0 2px rgba(124,111,247,0.18)',
        }}>
          A
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#eef2ff', fontFamily: 'var(--font-body)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Abdulrhman
          </p>
          <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
            abullrahmansouror@gmail.com
          </p>
        </div>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#06d6a0', boxShadow: '0 0 6px rgba(6,214,160,0.7)', flexShrink: 0 }} />
      </div>
    </aside>
  );
}
