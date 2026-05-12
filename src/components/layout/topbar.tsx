'use client';

import { Bell, Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: string; label: string; sub: string; href: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

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
        supabase.from('clients').select('id, full_name, company_name, email').or(`full_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%`).limit(5),
        supabase.from('invoices').select('id, invoice_number, status, total, clients(full_name)').or(`invoice_number.ilike.%${q}%,status.ilike.%${q}%`).limit(5),
      ]);

      const clientResults = (clientsRes.data || []).map((c: any) => ({
        type: 'Client',
        label: c.full_name || c.company_name || '-',
        sub: c.company_name || c.email || '',
        href: '/dashboard/clients',
      }));

      const invoiceResults = (invoicesRes.data || []).map((i: any) => ({
        type: 'Invoice',
        label: i.invoice_number,
        sub: `${i.clients?.full_name || ''} · SAR ${Number(i.total).toLocaleString()} · ${i.status}`,
        href: '/dashboard/invoices',
      }));

      const all = [...clientResults, ...invoiceResults];
      setResults(all);
      setOpen(all.length > 0);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
      <div ref={ref} className="relative w-64">
        <div className="flex items-center gap-3 bg-surface2 rounded-lg px-3 py-2">
          <Search size={15} className="text-text-faint shrink-0" />
          <input
            type="text"
            placeholder="Search clients, invoices..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            className="bg-transparent text-sm text-text-primary placeholder-text-faint focus:outline-none w-full"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}>
              <X size={13} className="text-text-faint hover:text-text-primary" />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute top-full mt-1 left-0 w-80 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            {loading ? (
              <p className="text-xs text-text-faint px-4 py-3">Searching...</p>
            ) : results.length === 0 ? (
              <p className="text-xs text-text-faint px-4 py-3">No results found</p>
            ) : results.map((r, i) => (
              <button
                key={i}
                onClick={() => go(r.href)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface2 transition-colors text-left border-b border-border last:border-0"
              >
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 ${
                  r.type === 'Client' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                }`}>{r.type}</span>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate">{r.label}</p>
                  <p className="text-xs text-text-faint truncate">{r.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-surface2 transition-colors">
          <Bell size={18} className="text-text-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">A</span>
        </div>
      </div>
    </header>
  );
}
