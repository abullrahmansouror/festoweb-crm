'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2, Repeat, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
}

interface Subscription {
  id: string;
  name: string;
  category: string;
  cost: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  renewal_date: string;
  status: string;
  notes?: string;
}

const CATEGORIES = ['hosting','domains','plugins','ads','freelancers','tools','software','other'];

export default function ExpensesPage() {
  const [expenses, setExpenses]         = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState<Expense | null>(null);
  const [form, setForm] = useState({
    title: '', category: 'hosting', amount: '', currency: 'SAR',
    date: new Date().toISOString().split('T')[0], notes: '',
  });

  async function fetchAll() {
    const supabase = createClient();
    const [expRes, subRes] = await Promise.all([
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('subscriptions').select('*').eq('status', 'active'),
    ]);
    setExpenses(expRes.data || []);
    setSubscriptions(subRes.data || []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function saveExpense() {
    const supabase = createClient();
    const payload = { ...form, amount: Number(form.amount) };
    if (editing) await supabase.from('expenses').update(payload).eq('id', editing.id);
    else await supabase.from('expenses').insert(payload);
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', category: 'hosting', amount: '', currency: 'SAR', date: new Date().toISOString().split('T')[0], notes: '' });
    fetchAll();
  }

  async function deleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return;
    await createClient().from('expenses').delete().eq('id', id);
    fetchAll();
  }

  // ── Merged data ───────────────────────────────────
  const allRows = useMemo(() => {
    const expRows = expenses.map(e => ({
      id: e.id, title: e.title, category: e.category,
      amount: Number(e.amount), currency: e.currency,
      date: e.date, notes: e.notes,
      rowType: 'expense' as const,
    }));

    const subRows = subscriptions.map(s => ({
      id: s.id,
      title: s.name,
      category: s.category === 'domain' ? 'domains' : s.category === 'tool' ? 'tools' : s.category,
      amount: s.cost,
      currency: s.currency,
      date: s.renewal_date,
      notes: s.billing_cycle === 'monthly' ? 'Monthly subscription' : 'Yearly subscription',
      rowType: 'subscription' as const,
      billing_cycle: s.billing_cycle,
    }));

    return [...expRows, ...subRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses, subscriptions]);

  // ── Totals ────────────────────────────────────────
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalSubsMonthly = subscriptions.reduce(
    (s, sub) => s + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12),
    0
  );

  // ── Chart — expenses per month + subscription costs ─
  const monthlyMap: Record<string, number> = {};
  expenses.forEach(e => {
    const m = e.date.slice(0, 7);
    monthlyMap[m] = (monthlyMap[m] || 0) + Number(e.amount);
  });
  const thisMonth = new Date().toISOString().slice(0, 7);
  subscriptions.forEach(s => {
    const m = s.billing_cycle === 'monthly' ? thisMonth : s.renewal_date.slice(0, 7);
    monthlyMap[m] = (monthlyMap[m] || 0) + s.cost;
  });
  const chartData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month: month.slice(5), amount }));

  // ── Category breakdown (expenses + subscriptions monthly equiv.) ──
  const catMap: Record<string, number> = {};
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount); });
  subscriptions.forEach(s => {
    const cat = s.category === 'domain' ? 'domains' : s.category === 'tool' ? 'tools' : s.category;
    catMap[cat] = (catMap[cat] || 0) + (s.billing_cycle === 'monthly' ? s.cost : s.cost / 12);
  });
  const combinedTotal = Object.values(catMap).reduce((s, v) => s + v, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#eef2ff', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
            Expenses
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 13, marginTop: 5, fontFamily: 'var(--font-body)' }}>
            {formatCurrency(totalExpenses)} one-time
            {subscriptions.length > 0 && (
              <span style={{ marginLeft: 8, color: 'rgba(124,111,247,0.8)' }}>
                + {formatCurrency(Math.round(totalSubsMonthly))}/mo from {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, background: '#7c6ff7', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff', fontFamily: 'var(--font-display)', marginBottom: 16 }}>Monthly Expenses</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
              <Tooltip contentStyle={{ background: 'rgba(13,17,23,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 12 }} itemStyle={{ color: '#eef2ff' }} labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="amount" fill="#ff6b6b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff', fontFamily: 'var(--font-display)', marginBottom: 16 }}>By Category</p>
          {combinedTotal === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontFamily: 'var(--font-body)', marginTop: 40, textAlign: 'center' }}>No data</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(catMap).sort(([,a],[,b]) => b - a).map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize', width: 84, flexShrink: 0, fontFamily: 'var(--font-body)' }}>{cat}</span>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 6 }}>
                    <div style={{ background: '#7c6ff7', height: 6, borderRadius: 999, width: `${Math.round((amt / combinedTotal) * 100)}%`, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#eef2ff', fontFamily: 'var(--font-body)', width: 76, textAlign: 'right', flexShrink: 0 }}>{formatCurrency(Math.round(amt))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#eef2ff', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
            {editing ? 'Edit Expense' : 'Add Expense'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { placeholder: 'Title *',  value: form.title,    key: 'title',    type: 'text' },
              { placeholder: 'Amount',   value: form.amount,   key: 'amount',   type: 'number' },
              { placeholder: 'Notes',    value: form.notes,    key: 'notes',    type: 'text' },
            ].map(({ placeholder, value, key, type }) => (
              <input
                key={key} type={type} placeholder={placeholder} value={value}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: '#eef2ff', outline: 'none', fontFamily: 'var(--font-body)' }}
              />
            ))}
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: '#eef2ff', outline: 'none', fontFamily: 'var(--font-body)' }}>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0d1117' }}>{c}</option>)}
            </select>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: '#eef2ff', outline: 'none', fontFamily: 'var(--font-body)' }}>
              {['SAR','USD','EUR','GBP','AED','MAD'].map(c => <option key={c} value={c} style={{ background: '#0d1117' }}>{c}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: '#eef2ff', outline: 'none', fontFamily: 'var(--font-body)' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => { setShowForm(false); setEditing(null); }}
              style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Cancel
            </button>
            <button onClick={saveExpense}
              style={{ padding: '8px 20px', background: '#7c6ff7', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {editing ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Title', 'Category', 'Amount', 'Date', 'Notes', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', padding: '12px 16px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.28)', fontSize: 13, fontFamily: 'var(--font-body)' }}>Loading…</td></tr>
            ) : allRows.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.28)', fontSize: 13, fontFamily: 'var(--font-body)' }}>No expenses yet</td></tr>
            ) : allRows.map(row => (
              <tr key={`${row.rowType}-${row.id}`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#eef2ff', fontWeight: 500, fontFamily: 'var(--font-body)' }}>{row.title}</span>
                    {row.rowType === 'subscription' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: 'rgba(124,111,247,0.12)', color: '#a89ff9', letterSpacing: '0.04em', fontFamily: 'var(--font-body)' }}>
                        <Repeat size={9} /> SUB
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>
                    {row.category}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#ff6b6b', fontWeight: 600, fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(row.amount, row.currency)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>
                  {formatDate(row.date)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>
                  {row.notes || '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {row.rowType === 'expense' ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => { setEditing(row as Expense); setForm({ title: row.title, category: row.category, amount: String(row.amount), currency: row.currency, date: row.date, notes: row.notes || '' }); setShowForm(true); }}
                        style={{ padding: '5px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,111,247,0.1)'; e.currentTarget.style.color = '#a89ff9'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteExpense(row.id)}
                        style={{ padding: '5px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; e.currentTarget.style.color = '#ff6b6b'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <Link href="/dashboard/subscriptions"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(124,111,247,0.6)', textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'color 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#a89ff9')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(124,111,247,0.6)')}
                    >
                      Manage <ArrowUpRight size={11} />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
