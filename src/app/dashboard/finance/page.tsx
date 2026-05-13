'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle, FileDown, Trash2 } from 'lucide-react';
import { InvoiceModal } from '@/components/finance/invoice-modal';
import { createClient } from '@/lib/supabase/client';
import { generateInvoicePDF } from '@/lib/pdf';
import { useCurrency } from '@/lib/currency-context';
import type { Invoice } from '@/types';

const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900) + 100;
  return `INV-${dateStr}-${rand}`;
};

export default function FinancePage() {
  const { fmt, convert, currency, symbol } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else if (data) setInvoices(data as Invoice[]);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  // Re-compute KPIs whenever currency changes — no refetch needed
  const { income, pending, expenses } = useMemo(() => ({
    income:   invoices.filter(i => i.type === 'income'  && i.status === 'Paid')
                      .reduce((s, i) => s + convert((i as any).total ?? i.amount ?? 0, (i as any).currency || 'SAR'), 0),
    pending:  invoices.filter(i => i.type === 'income'  && i.status === 'Sent')
                      .reduce((s, i) => s + convert((i as any).total ?? i.amount ?? 0, (i as any).currency || 'SAR'), 0),
    expenses: invoices.filter(i => i.type === 'expense')
                      .reduce((s, i) => s + convert((i as any).total ?? i.amount ?? 0, (i as any).currency || 'SAR'), 0),
  }), [invoices, convert, currency]);

  const overdue = invoices.filter(i => i.status === 'Overdue').length;

  const handleSave = async (inv: any) => {
    const taxRate = Number(inv.tax_rate || 0);
    const amount  = Number(inv.amount   || 0);
    const taxAmt  = (amount * taxRate) / 100;
    const total   = amount + taxAmt;
    const payload = {
      client_name:  inv.client_name,
      client_email: inv.client_email  || null,
      client_phone: inv.client_phone  || null,
      amount, tax_rate: taxRate || null, tax_amount: taxAmt || null, total,
      type: inv.type, status: inv.status, description: inv.description,
      note: inv.note || null,
      date: inv.date || new Date().toISOString().split('T')[0],
      due_date: inv.due_date || null,
      updated_at: new Date().toISOString(),
    };
    if (editingInvoice) {
      const { error: err } = await supabase.from('invoices').update(payload).eq('id', inv.id);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from('invoices').insert([{
        ...payload, invoice_number: generateInvoiceNumber(), created_at: new Date().toISOString(),
      }]);
      if (err) { setError(err.message); return; }
    }
    setError(null); setShowModal(false); setEditingInvoice(null); fetchInvoices();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error: err } = await supabase.from('invoices').delete().eq('id', id);
    if (err) setError(err.message);
    else setInvoices(prev => prev.filter(i => i.id !== id));
    setDeletingId(null); setConfirmDeleteId(null);
  };

  const statusColors: Record<string, string> = {
    Paid: 'bg-accent/10 text-accent', Sent: 'bg-blue-400/10 text-blue-400',
    Draft: 'bg-surface2 text-text-muted', Overdue: 'bg-red-400/10 text-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Finance</h1>
          <p className="text-text-muted text-sm mt-1">Invoices, income &amp; expenses
            <span className="ml-2 text-xs text-text-faint bg-surface2 border border-border px-2 py-0.5 rounded-full">{symbol}</span>
          </p>
        </div>
        <button onClick={() => { setEditingInvoice(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Invoice
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">⚠️ {error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp,   label: 'Income Received', value: fmt(income),         color: 'bg-accent/10 text-accent' },
          { icon: DollarSign,   label: 'Pending (Sent)',  value: fmt(pending),         color: 'bg-blue-400/10 text-blue-400' },
          { icon: TrendingDown, label: 'Expenses',        value: fmt(expenses),        color: 'bg-red-400/10 text-red-400' },
          { icon: AlertCircle,  label: 'Overdue',         value: `${overdue} invoices`, color: 'bg-orange-400/10 text-orange-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${color}`}><Icon size={16} /></div>
              <p className="text-text-muted text-xs">{label}</p>
            </div>
            <p className="text-text-primary font-bold text-xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-text-primary font-semibold">All Transactions</p>
        </div>
        {loading ? (
          <div className="text-center py-12"><p className="text-text-muted text-sm">Loading...</p></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted text-sm">No transactions yet</p>
            <button onClick={() => { setEditingInvoice(null); setShowModal(true); }} className="mt-2 text-primary text-sm hover:underline">Add your first invoice</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['#', 'Client / Description', 'Type', `Amount (${symbol})`, 'Tax%', `Total (${symbol})`, 'Status', 'Date', 'Due Date', ''].map(h => (
                    <th key={h} className="text-left text-text-faint text-xs font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const i = inv as any;
                  const rawCur = i.currency || 'SAR';
                  const convertedAmount = convert(i.amount ?? 0, rawCur);
                  const convertedTotal  = convert(i.total  ?? i.amount ?? 0, rawCur);
                  return (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-surface2 transition-colors">
                      <td className="px-4 py-3 text-text-faint text-xs tabular-nums">{i.invoice_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-text-primary text-sm font-medium">{inv.client_name}</p>
                        <p className="text-text-faint text-xs">{inv.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          inv.type === 'income' ? 'bg-accent/10 text-accent' : 'bg-red-400/10 text-red-400'
                        }`}>{inv.type}</span>
                      </td>
                      <td className="px-4 py-3 text-text-primary text-sm tabular-nums">{fmt(convertedAmount)}</td>
                      <td className="px-4 py-3 text-text-muted text-xs tabular-nums">{i.tax_rate ? `${i.tax_rate}%` : '—'}</td>
                      <td className="px-4 py-3 text-text-primary text-sm font-semibold tabular-nums">{fmt(convertedTotal)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[inv.status] || ''}`}>{inv.status}</span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-sm">{inv.date}</td>
                      <td className="px-4 py-3 text-text-muted text-sm">{inv.due_date || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => generateInvoicePDF(i)}
                            className="flex items-center gap-1 text-text-faint hover:text-primary text-xs transition-colors" title="Export PDF">
                            <FileDown size={13} /> PDF
                          </button>
                          <button onClick={() => { setEditingInvoice(inv); setShowModal(true); }}
                            className="text-text-faint hover:text-primary text-xs transition-colors">Edit</button>
                          {confirmDeleteId === inv.id ? (
                            <span className="flex items-center gap-1">
                              <button onClick={() => handleDelete(inv.id)} disabled={deletingId === inv.id}
                                className="text-red-400 hover:text-red-500 text-xs font-semibold disabled:opacity-50">
                                {deletingId === inv.id ? 'Deleting...' : 'Confirm'}
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)}
                                className="text-text-faint hover:text-text-muted text-xs ml-1">Cancel</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(inv.id)}
                              className="text-text-faint hover:text-red-400 text-xs transition-colors" title="Delete">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <InvoiceModal invoice={editingInvoice} onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingInvoice(null); }} />
      )}
    </div>
  );
}
