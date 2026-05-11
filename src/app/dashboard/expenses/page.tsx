'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Expense } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORIES = ['hosting','domains','plugins','ads','freelancers','tools','software','other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ title: '', category: 'hosting', amount: '', currency: 'SAR', date: new Date().toISOString().split('T')[0], notes: '' });

  async function fetchExpenses() {
    const supabase = createClient();
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchExpenses(); }, []);

  async function saveExpense() {
    const supabase = createClient();
    const data = { ...form, amount: Number(form.amount) };
    if (editing) await supabase.from('expenses').update(data).eq('id', editing.id);
    else await supabase.from('expenses').insert(data);
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', category: 'hosting', amount: '', currency: 'SAR', date: new Date().toISOString().split('T')[0], notes: '' });
    fetchExpenses();
  }

  async function deleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return;
    await createClient().from('expenses').delete().eq('id', id);
    fetchExpenses();
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Monthly breakdown chart
  const monthlyMap: Record<string, number> = {};
  expenses.forEach(e => {
    const month = e.date.slice(0, 7);
    monthlyMap[month] = (monthlyMap[month] || 0) + Number(e.amount);
  });
  const chartData = Object.entries(monthlyMap).slice(-6).map(([month, amount]) => ({ month: month.slice(5), amount }));

  // Category breakdown
  const catMap: Record<string, number> = {};
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount); });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Expenses</h1>
          <p className="text-text-muted text-sm">Total: {formatCurrency(totalExpenses)}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-text-primary font-semibold mb-4">Monthly Expenses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="month" stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <YAxis stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f1f1f1' }} />
              <Bar dataKey="amount" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-text-primary font-semibold mb-4">By Category</h3>
          <div className="space-y-2">
            {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-text-muted text-xs capitalize w-24 shrink-0">{cat}</span>
                <div className="flex-1 bg-surface2 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(amt / totalExpenses) * 100}%` }} />
                </div>
                <span className="text-text-primary text-xs font-medium w-20 text-right">{formatCurrency(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-text-primary font-semibold mb-4">{editing ? 'Edit' : 'Add'} Expense</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-4 py-2 bg-surface2 text-text-primary rounded-lg text-sm">Cancel</button>
            <button onClick={saveExpense}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm">
              {editing ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Title','Category','Amount','Date','Notes','Actions'].map(h => (
                <th key={h} className="text-left text-xs text-text-faint font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-text-muted">Loading...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-text-muted">No expenses yet</td></tr>
            ) : expenses.map(exp => (
              <tr key={exp.id} className="border-b border-border hover:bg-surface2 transition-colors">
                <td className="px-4 py-3 text-sm text-text-primary">{exp.title}</td>
                <td className="px-4 py-3"><span className="text-xs bg-surface2 text-text-muted px-2 py-1 rounded-full capitalize">{exp.category}</span></td>
                <td className="px-4 py-3 text-sm text-error font-medium">{formatCurrency(exp.amount, exp.currency)}</td>
                <td className="px-4 py-3 text-sm text-text-faint">{formatDate(exp.date)}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{exp.notes || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(exp); setForm({title: exp.title, category: exp.category, amount: String(exp.amount), currency: exp.currency, date: exp.date, notes: exp.notes || ''}); setShowForm(true); }}
                      className="p-1.5 hover:bg-surface2 rounded text-text-faint hover:text-primary transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => deleteExpense(exp.id)}
                      className="p-1.5 hover:bg-surface2 rounded text-text-faint hover:text-error transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
