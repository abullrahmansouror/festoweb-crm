'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Download, Pencil, Trash2, Search } from 'lucide-react';
import { InvoiceModal } from '@/components/invoices/invoice-modal';
import { generateInvoicePDF } from '@/lib/pdf';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400',
  sent: 'bg-blue-500/10 text-blue-400',
  paid: 'bg-accent/10 text-accent',
  overdue: 'bg-error/10 text-error',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');

  async function fetchInvoices() {
    const supabase = createClient();
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(full_name, company_name), invoice_items(*)')
      .order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchInvoices(); }, []);

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.clients?.full_name?.toLowerCase().includes(q) ||
      inv.clients?.company_name?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q) ||
      String(inv.total).includes(q)
    );
  });

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return;
    const supabase = createClient();
    await supabase.from('invoices').delete().eq('id', id);
    fetchInvoices();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invoices</h1>
          <p className="text-text-muted text-sm">{invoices.length} total invoices</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['draft','sent','paid','overdue'].map(s => (
          <div key={s} className="bg-surface border border-border rounded-xl p-4">
            <p className="text-text-muted text-xs capitalize mb-1">{s}</p>
            <p className="text-text-primary font-bold text-lg">
              {formatCurrency(invoices.filter(i => i.status === s).reduce((sum, i) => sum + Number(i.total), 0))}
            </p>
            <p className="text-text-faint text-xs">{invoices.filter(i => i.status === s).length} invoices</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <input
          type="text"
          placeholder="Search by invoice #, client, status..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Invoice #','Client','Amount','Tax','Total','Status','Due Date','Actions'].map(h => (
                <th key={h} className="text-left text-xs text-text-faint font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-text-muted">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-text-muted">
                {search ? `No results for "${search}"` : 'No invoices yet'}
              </td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.id} className="border-b border-border hover:bg-surface2 transition-colors">
                <td className="px-4 py-3 text-sm text-primary font-medium">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-sm text-text-primary">{inv.clients?.full_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{formatCurrency(inv.subtotal, inv.currency)}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{inv.tax_rate}%</td>
                <td className="px-4 py-3 text-sm text-text-primary font-semibold">{formatCurrency(inv.total, inv.currency)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-text-faint">{inv.due_date ? formatDate(inv.due_date) : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => generateInvoicePDF(inv)}
                      className="p-1.5 hover:bg-surface2 rounded text-text-faint hover:text-accent transition-colors">
                      <Download size={14} />
                    </button>
                    <button onClick={() => { setEditing(inv); setShowModal(true); }}
                      className="p-1.5 hover:bg-surface2 rounded text-text-faint hover:text-primary transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteInvoice(inv.id)}
                      className="p-1.5 hover:bg-surface2 rounded text-text-faint hover:text-error transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <InvoiceModal invoice={editing} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchInvoices(); }} />
      )}
    </div>
  );
}
