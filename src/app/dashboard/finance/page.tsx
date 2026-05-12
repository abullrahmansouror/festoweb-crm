'use client';

import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { InvoiceModal } from '@/components/finance/invoice-modal';
import type { Invoice } from '@/types';

const initialInvoices: Invoice[] = [
  { id: '1', client_name: 'Faisal Al-Dosari', amount: 8000, type: 'income', status: 'paid', description: 'Website Design Project', date: '2024-04-01', due_date: '2024-04-15' },
  { id: '2', client_name: 'Nora Fashion', amount: 7500, type: 'income', status: 'pending', description: 'E-commerce deposit 50%', date: '2024-04-05', due_date: '2024-04-20' },
  { id: '3', client_name: 'STC Tools', amount: 2400, type: 'expense', status: 'paid', description: 'Adobe CC + Figma annual', date: '2024-04-02' },
  { id: '4', client_name: 'Omar Bakr', amount: 3500, type: 'income', status: 'overdue', description: 'Landing Page - Overdue', date: '2024-03-15', due_date: '2024-03-30' },
];

const KPI = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="bg-surface border border-border rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-lg ${color}`}><Icon size={16} /></div>
      <p className="text-text-muted text-xs">{label}</p>
    </div>
    <p className="text-text-primary font-bold text-xl">{value}</p>
  </div>
);

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const income = invoices.filter(i => i.type === 'income' && i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.type === 'income' && i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const expenses = invoices.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter(i => i.status === 'overdue').length;

  const handleSave = (inv: Invoice) => {
    if (editingInvoice) {
      setInvoices(prev => prev.map(i => i.id === inv.id ? inv : i));
    } else {
      setInvoices(prev => [...prev, { ...inv, id: Date.now().toString() }]);
    }
    setShowModal(false);
    setEditingInvoice(null);
  };

  const statusColors: Record<string, string> = {
    paid: 'bg-accent/10 text-accent',
    pending: 'bg-yellow-400/10 text-yellow-400',
    overdue: 'bg-red-400/10 text-red-400',
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={TrendingUp} label="Income Received" value={`SAR ${income.toLocaleString()}`} color="bg-accent/10 text-accent" />
        <KPI icon={DollarSign} label="Pending" value={`SAR ${pending.toLocaleString()}`} color="bg-yellow-400/10 text-yellow-400" />
        <KPI icon={TrendingDown} label="Expenses" value={`SAR ${expenses.toLocaleString()}`} color="bg-red-400/10 text-red-400" />
        <KPI icon={AlertCircle} label="Overdue" value={`${overdue} invoices`} color="bg-orange-400/10 text-orange-400" />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-text-primary font-semibold">All Transactions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Client / Description', 'Type', 'Amount', 'Status', 'Date', 'Due Date', ''].map(h => (
                  <th key={h} className="text-left text-text-faint text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-surface2 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-text-primary text-sm font-medium">{inv.client_name}</p>
                    <p className="text-text-faint text-xs">{inv.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${inv.type === 'income' ? 'bg-accent/10 text-accent' : 'bg-red-400/10 text-red-400'}`}>{inv.type}</span>
                  </td>
                  <td className="px-4 py-3 text-text-primary text-sm font-semibold tabular-nums">SAR {inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColors[inv.status]}`}>{inv.status}</span></td>
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
      </div>

      {showModal && <InvoiceModal invoice={editingInvoice} onSave={handleSave} onClose={() => { setShowModal(false); setEditingInvoice(null); }} />}
    </div>
  );
}
