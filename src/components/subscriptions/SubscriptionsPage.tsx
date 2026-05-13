'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, Pencil, Trash2, Globe, Server, Wrench, Package,
  TrendingUp, AlertTriangle, CheckCircle, PauseCircle, X, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Category = 'hosting' | 'domain' | 'tool' | 'other';
type BillingCycle = 'monthly' | 'yearly';
type Status = 'active' | 'cancelled' | 'paused';

interface Subscription {
  id: string;
  name: string;
  category: Category;
  cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  renewal_date: string;
  status: Status;
  website?: string;
  notes?: string;
  created_at: string;
}

// Exchange rates to SAR (approximate fixed rates)
const TO_SAR: Record<string, number> = {
  SAR: 1,
  USD: 3.75,
  EUR: 4.10,
  GBP: 4.75,
  AED: 1.02,
  MAD: 0.37,
};

function toSAR(amount: number, currency: string): number {
  return amount * (TO_SAR[currency] ?? 1);
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ElementType; color: string }> = {
  hosting: { label: 'Hosting', icon: Server, color: 'text-blue-400 bg-blue-400/10' },
  domain:  { label: 'Domain',  icon: Globe,  color: 'text-purple-400 bg-purple-400/10' },
  tool:    { label: 'Tool',    icon: Wrench,  color: 'text-amber-400 bg-amber-400/10' },
  other:   { label: 'Other',   icon: Package, color: 'text-slate-400 bg-slate-400/10' },
};

const STATUS_META: Record<Status, { label: string; icon: React.ElementType; color: string }> = {
  active:    { label: 'Active',    icon: CheckCircle,  color: 'text-accent bg-accent/10' },
  cancelled: { label: 'Cancelled', icon: X,            color: 'text-red-400 bg-red-400/10' },
  paused:    { label: 'Paused',    icon: PauseCircle,  color: 'text-amber-400 bg-amber-400/10' },
};

const EMPTY_FORM = {
  name: '', category: 'tool' as Category, cost: '',
  currency: 'SAR', billing_cycle: 'monthly' as BillingCycle,
  renewal_date: '', status: 'active' as Status, website: '', notes: '',
};

const inputCls = 'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-primary transition-colors';
const labelCls = 'text-text-muted text-xs font-medium block mb-1';

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function toYearlySAR(cost: number, currency: string, cycle: BillingCycle): number {
  const sarAmount = toSAR(cost, currency);
  return cycle === 'monthly' ? sarAmount * 12 : sarAmount;
}

export function SubscriptionsPage() {
  const supabase = createClient();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('subscriptions')
      .select('*')
      .order('renewal_date', { ascending: true });
    if (err) console.error('load error:', err);
    setSubs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const activeSubs = useMemo(() => subs.filter(s => s.status === 'active'), [subs]);

  const totalYearlySAR = useMemo(() =>
    activeSubs.reduce((sum, s) => sum + toYearlySAR(s.cost, s.currency, s.billing_cycle), 0),
    [activeSubs]
  );
  const totalMonthlySAR = useMemo(() => totalYearlySAR / 12, [totalYearlySAR]);

  const expiringSoon = useMemo(() =>
    activeSubs.filter(s => daysUntil(s.renewal_date) <= 30), [activeSubs]);

  const displayed = useMemo(() =>
    filterCat === 'all' ? subs : subs.filter(s => s.category === filterCat), [subs, filterCat]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setShowModal(true);
  }

  function openEdit(s: Subscription) {
    setEditing(s);
    setForm({
      name: s.name, category: s.category, cost: String(s.cost),
      currency: s.currency, billing_cycle: s.billing_cycle,
      renewal_date: s.renewal_date, status: s.status,
      website: s.website ?? '', notes: s.notes ?? '',
    });
    setError('');
    setShowModal(true);
  }

  async function save() {
    if (!form.name.trim() || !form.cost || !form.renewal_date) {
      setError('Please fill in Name, Cost, and Renewal Date.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      category: form.category,
      cost: parseFloat(form.cost),
      currency: form.currency,
      billing_cycle: form.billing_cycle,
      renewal_date: form.renewal_date,
      status: form.status,
      website: form.website.trim() || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error: err } = await supabase
        .from('subscriptions')
        .update(payload)
        .eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase
        .from('subscriptions')
        .insert([{ ...payload, created_at: new Date().toISOString() }]);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowModal(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this subscription?')) return;
    await supabase.from('subscriptions').delete().eq('id', id);
    load();
  }

  const f = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Subscriptions</h1>
          <p className="text-text-muted text-sm mt-1">Track your hosting, domains &amp; tools</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Subscription
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Cost',   value: `SAR ${f(totalMonthlySAR)}`, sub: 'converted to SAR',    icon: TrendingUp,    color: 'bg-accent/10 text-accent' },
          { label: 'Yearly Cost',    value: `SAR ${f(totalYearlySAR)}`,  sub: 'converted to SAR',    icon: TrendingUp,    color: 'bg-primary/10 text-primary' },
          { label: 'Active',         value: String(activeSubs.length),   sub: 'subscriptions',        icon: CheckCircle,   color: 'bg-blue-400/10 text-blue-400' },
          { label: 'Expiring Soon',  value: String(expiringSoon.length), sub: 'within 30 days',       icon: AlertTriangle, color: expiringSoon.length > 0 ? 'bg-amber-400/10 text-amber-400' : 'bg-surface2 text-text-muted' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${stat.color}`}><stat.icon size={16} /></div>
              <p className="text-text-muted text-xs">{stat.label}</p>
            </div>
            <p className="text-text-primary font-bold text-xl">{stat.value}</p>
            <p className="text-text-faint text-xs mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Exchange Rate Notice */}
      {activeSubs.some(s => s.currency !== 'SAR') && (
        <div className="bg-blue-400/10 border border-blue-400/20 rounded-xl p-3 flex items-center gap-2">
          <span className="text-blue-400 text-xs font-medium">ℹ️</span>
          <p className="text-text-muted text-xs">
            Stats are converted to SAR using fixed rates: 1 USD = 3.75 · 1 EUR = 4.10 · 1 GBP = 4.75 · 1 AED = 1.02 · 1 MAD = 0.37
          </p>
        </div>
      )}

      {/* Expiring Banner */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-400 font-medium text-sm">Renewing soon</p>
            <p className="text-text-muted text-xs mt-0.5">
              {expiringSoon.map(s => `${s.name} (${daysUntil(s.renewal_date)}d)`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'hosting', 'domain', 'tool', 'other'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
              filterCat === cat
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:bg-surface2 hover:text-text-primary'
            )}
          >
            {cat === 'all' ? 'All' : CATEGORY_META[cat].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <Package size={32} className="text-text-faint mx-auto mb-3" />
            <p className="text-text-muted text-sm">No subscriptions yet</p>
            <p className="text-text-faint text-xs mt-1">Click &quot;Add Subscription&quot; to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Category', 'Cost', 'SAR Equiv.', 'Billing', 'Renewal', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-text-faint font-medium text-xs px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map(s => {
                  const days = daysUntil(s.renewal_date);
                  const CatIcon = CATEGORY_META[s.category].icon;
                  const StatIcon = STATUS_META[s.status].icon;
                  const sarEquiv = toSAR(s.cost, s.currency);
                  const sarYearly = toYearlySAR(s.cost, s.currency, s.billing_cycle);
                  return (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-surface2 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary text-sm">{s.name}</p>
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer"
                            className="text-text-faint text-xs hover:text-primary transition-colors">
                            {s.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium', CATEGORY_META[s.category].color)}>
                          <CatIcon size={11} />
                          {CATEGORY_META[s.category].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary text-sm tabular-nums">{s.currency} {s.cost.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary text-sm tabular-nums">SAR {f(sarEquiv)}</p>
                        <p className="text-text-faint text-xs tabular-nums">SAR {f(sarYearly)}/yr</p>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-sm capitalize">{s.billing_cycle}</td>
                      <td className="px-4 py-3">
                        <p className="text-text-primary text-sm">{new Date(s.renewal_date).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className={cn('text-xs', days <= 7 ? 'text-red-400' : days <= 30 ? 'text-amber-400' : 'text-text-faint')}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', STATUS_META[s.status].color)}>
                          <StatIcon size={10} />
                          {STATUS_META[s.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-md text-text-faint hover:text-text-primary hover:bg-surface2 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => remove(s.id)} className="p-1.5 rounded-md text-text-faint hover:text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 size={13} />
                          </button>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-surface z-10">
              <h2 className="font-semibold text-text-primary">{editing ? 'Edit Subscription' : 'Add Subscription'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface2 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <div>
                <label className={labelCls}>Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  placeholder="e.g. Vercel Pro"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({...p, category: e.target.value as Category}))}
                  className={inputCls}
                >
                  <option value="hosting">Hosting</option>
                  <option value="domain">Domain</option>
                  <option value="tool">Tool</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cost *</label>
                  <input
                    type="number"
                    value={form.cost}
                    onChange={e => setForm(p => ({...p, cost: e.target.value}))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm(p => ({...p, currency: e.target.value}))}
                    className={inputCls}
                  >
                    <option value="SAR">SAR 🇸🇦</option>
                    <option value="USD">USD 🇺🇸</option>
                    <option value="EUR">EUR 🇪🇺</option>
                    <option value="GBP">GBP 🇬🇧</option>
                    <option value="AED">AED 🇦🇪</option>
                    <option value="MAD">MAD 🇲🇦</option>
                  </select>
                </div>
              </div>

              {form.currency !== 'SAR' && form.cost && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <p className="text-primary text-xs">
                    ≈ SAR {f(toSAR(parseFloat(form.cost) || 0, form.currency))} at current rate
                    {form.billing_cycle === 'monthly' && ` · SAR ${f(toSAR(parseFloat(form.cost) || 0, form.currency) * 12)}/yr`}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Billing Cycle</label>
                  <select
                    value={form.billing_cycle}
                    onChange={e => setForm(p => ({...p, billing_cycle: e.target.value as BillingCycle}))}
                    className={inputCls}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Renewal Date *</label>
                  <input
                    type="date"
                    value={form.renewal_date}
                    onChange={e => setForm(p => ({...p, renewal_date: e.target.value}))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({...p, status: e.target.value as Status}))}
                  className={inputCls}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Website</label>
                <input
                  value={form.website}
                  onChange={e => setForm(p => ({...p, website: e.target.value}))}
                  placeholder="https://vercel.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                  placeholder="Optional notes..."
                  rows={2}
                  className={cn(inputCls, 'resize-none')}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-surface2 border border-border text-text-muted hover:text-text-primary text-sm py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editing ? 'Save Changes' : 'Add Subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
