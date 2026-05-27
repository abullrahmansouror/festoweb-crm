'use client';

import { Bell, Search, X, Sparkles, Upload, Download } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<{ type: string; label: string; sub: string; href: string }[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const q = query.trim();
      const [clientsRes, invoicesRes] = await Promise.all([
        supabase.from('clients').select('id, full_name, company_name, email')
          .or(`full_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%`).limit(5),
        supabase.from('invoices').select('id, invoice_number, status, total, clients(full_name)')
          .or(`invoice_number.ilike.%${q}%,status.ilike.%${q}%`).limit(5),
      ]);
      const all = [
        ...(clientsRes.data || []).map((c: any) => ({ type: 'Client',  label: c.full_name || c.company_name || '-', sub: c.company_name || c.email || '', href: '/dashboard/clients' })),
        ...(invoicesRes.data || []).map((i: any) => ({ type: 'Invoice', label: i.invoice_number, sub: `${i.clients?.full_name || ''} · SAR ${Number(i.total).toLocaleString()} · ${i.status}`, href: '/dashboard/invoices' })),
      ];
      setResults(all);
      setOpen(all.length > 0);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const go = (href: string) => { setOpen(false); setQuery(''); router.push(href); };

  return (
    <header style={{
      height: 56,
      background: 'rgba(7, 9, 14, 0.92)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 20px',
      flexShrink: 0,
      position: 'relative',
      zIndex: 40,
    }}>
      {/* Search */}
      <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '7px 12px',
        }}>
          <Search size={14} color="rgba(255,255,255,0.28)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search clients, invoices…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#eef2ff', width: '100%', fontFamily: 'var(--font-body)' }}
          />
          {query ? (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={13} color="rgba(255,255,255,0.28)" />
            </button>
          ) : (
            <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: 'rgba(255,255,255,0.22)', flexShrink: 0, fontFamily: 'var(--font-body)' }}>
              ⌘K
            </span>
          )}
        </div>

        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 340, background: 'rgba(13,17,23,0.98)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,111,247,0.08)', zIndex: 50 }}>
            {loading ? (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', padding: '14px 16px', fontFamily: 'var(--font-body)' }}>Searching…</p>
            ) : results.length === 0 ? (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', padding: '14px 16px', fontFamily: 'var(--font-body)' }}>No results found</p>
            ) : results.map((r, i) => (
              <button key={i} onClick={() => go(r.href)}
                style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s', fontFamily: 'var(--font-body)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 10, padding: '3px 7px', borderRadius: 5, fontWeight: 600, flexShrink: 0, marginTop: 2, letterSpacing: '0.04em', ...(r.type === 'Client' ? { background: 'rgba(124,111,247,0.15)', color: '#a89ff9' } : { background: 'rgba(96,165,250,0.15)', color: '#93c5fd' }) }}>
                  {r.type}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: '#eef2ff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ask AI button */}
      <button
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 9,
          background: 'linear-gradient(135deg, rgba(124,111,247,0.15), rgba(6,214,160,0.07))',
          border: '1px solid rgba(124,111,247,0.28)',
          color: '#a89ff9', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'var(--font-body)', letterSpacing: '-0.01em',
          transition: 'all 0.15s', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,111,247,0.22), rgba(6,214,160,0.1))'; e.currentTarget.style.borderColor = 'rgba(124,111,247,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,111,247,0.15), rgba(6,214,160,0.07))'; e.currentTarget.style.borderColor = 'rgba(124,111,247,0.28)'; }}
      >
        <Sparkles size={13} />
        Ask AI
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {[
          { icon: Upload,   label: 'Import' },
          { icon: Download, label: 'Export' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 9,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          style={{ position: 'relative', width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <Bell size={15} color="rgba(255,255,255,0.45)" />
          <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#7c6ff7', border: '1.5px solid #07090e', boxShadow: '0 0 6px rgba(124,111,247,0.8)' }} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #7c6ff7 0%, #06d6a0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 0 2px rgba(124,111,247,0.2)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
          A
        </div>
      </div>
    </header>
  );
}
