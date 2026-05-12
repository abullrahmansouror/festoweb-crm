'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { InvoiceModal } from '@/components/finance/invoice-modal';
import { createClient } from '@/lib/supabase/client';
import type { Invoice } from '@/types';

const KPI = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="bg-surface border border-border rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-lg ${color}`}><Icon size={16} /></div>
      <p className="text-text-muted text-xs">{label}</p>
    </div>
    <p className="text-text-primary font-bold text-xl">{value}</p>
  </div>
);

const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(Math.random() * 900) + 100;
  return `INV-${dateStr}-${rand}`;
};

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Use capitalized status values matching DB constraint: Draft, Sent, Paid, Overdue
  const income   = invoices.filter(i => i.type === 'income' && i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0);
  const pending  = invoices.filter(i => i.type === 'income' && i.status === 'Sent').reduce((s, i) => s + (i.amount || 0), 0);
  const expenses = invoices.filter(i => i.type === 'expense').reduce((s, i) => s + (i.amount || 0), 0);
  const overdue  = invoices.filter(i => i.status === 'Overdue').length;

  const handleSave = async (inv: Invoice) => {
    const payload = {
      client_name: inv.client_name,
      amount: inv.amount,
      type: inv.type,
      status: inv.status,
      description: inv.description,
      date: inv.date || new Date().toISOString().split('T')[0],
      due_date: inv.due_date || null,
      updated_at: new Date().toISOString(),
    };
    if (editingInvoice) {
      const { error: err } = await supabase.from('invoices').update(payload).eq('id', inv.id);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from('invoices').insert([{
        ...payload,
        invoice_number: generateInvoiceNumber(),
        created_at: new Date().toISOString(),
      }]);
      if (err) { setError(err.message); return; }
    }
    setError(null);
    setShowModal(false);
    setEditingInvoice(null);
    fetchInvoices();
  };

  const statusColors: Record<string, string> = {
    Paid: 'bg-accent/10 text-accent',
    Sent: 'bg-blue-400/10 text-blue-400',
    Draft: 'bg-surface-dynamic text-text-muted',
    Overdue: 'bg-red-400/10 text-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Finance</h1>
          <p className="text-text-muted text-sm mt-1">Invoices, income & expenses</p>
        </div>
        <button onClick={() => { setEditingInvoice(null); setShowModal(true); }} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Invoice
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          ⚠️ Error: {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={TrendingUp}  label="Income Received" value={`SAR ${income.toLocaleString()}`}   color="bg-accent/10 text-accent" />
        <KPI icon={DollarSign}  label="Pending (Sent)"  value={`SAR ${pending.toLocaleString()}`}  color="bg-blue-400/10 text-blue-400" />
        <KPI icon={TrendingDown} label="Expenses"       value={`SAR ${expenses.toLocaleString()}`} color="bg-red-400/10 text-red-400" />
        <KPI icon={AlertCircle} label="Overdue"         value={`${overdue} invoices`}               color="bg-orange-400/10 text-orange-400" />
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
                  {['#', 'Client / Description', 'Type', 'Amount', 'Status', 'Date', 'Due Date', ''].map(h => (
                    <th key={h} className="text-left text-text-faint text-xs font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-surface2 transition-colors">
                    <td className="px-4 py-3 text-text-faint text-xs tabular-nums">{(inv as any).invoice_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-text-primary text-sm font-medium">{inv.client_name}</p>
                      <p className="text-text-faint text-xs">{inv.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${inv.type === 'income' ? 'bg-accent/10 text-accent' : 'bg-red-400/10 text-red-400'}`}>{inv.type}</span>
                    </td>
                    <td className="px-4 py-3 text-text-primary text-sm font-semibold tabular-nums">SAR {(inv.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColors[inv.status] || ''}`}>{inv.status}</span></td>
                    <td className="px-4 py-3 text-text-muted text-sm">{inv.date}</td>
                    <td className="px-4 py-3 text-text-muted text-sm">{inv.due_date || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setEditingInvoice(inv); setShowModal(true); }} className="text-text-faint hover:text-primary text-xs transition-colors">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <InvoiceModal invoice={editingInvoice} onSave={handleSave} onClose={() => { setShowModal(false); setEditingInvoice(null); }} />}
    </div>
  );
}
