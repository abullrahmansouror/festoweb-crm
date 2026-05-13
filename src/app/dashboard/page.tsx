'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Briefcase, CheckCircle, Users, FileText, Clock
} from 'lucide-react';
import { useCurrency } from '@/lib/currency-context';

/* ─── tiny reusable bar chart ─────────────────────────────────────────────── */
type BarSeries = { label: string; value: number; color: string }[];

function BarChart({
  months,
  series,
  maxVal,
  height = 128,
  legend,
}: {
  months: string[];
  series: BarSeries[];
  maxVal: number;
  height?: number;
  legend: { label: string; color: string }[];
}) {
  const hasData = series.some(s => s.some(bar => bar.value > 0));
  const barCount = series[0]?.length ?? 0;
  const seriesCount = series.length;
  // individual bar width as fraction of column
  const barW = Math.max(1, Math.floor(100 / barCount / (seriesCount + 1)));

  return (
    <div>
      {!hasData ? (
        <div
          className="flex items-center justify-center text-text-faint text-xs"
          style={{ height }}
        >
          No data yet
        </div>
      ) : (
        <div className="flex items-end gap-px" style={{ height }}>
          {months.map((month, mi) => (
            <div
              key={mi}
              className="flex-1 flex flex-col items-center"
              style={{ height: '100%' }}
            >
              {/* bar area — position:relative so bars can anchor to bottom */}
              <div
                className="w-full flex-1 relative"
                style={{ minHeight: 0 }}
              >
                {series.map((s, si) => {
                  const val = s[mi]?.value ?? 0;
                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  const left = si * (100 / seriesCount);
                  return (
                    <div
                      key={si}
                      title={`${s[mi]?.label ?? month}: ${val.toFixed(0)}`}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: `${left}%`,
                        width: `${100 / seriesCount - 4}%`,
                        height: pct > 0 ? `${pct}%` : '2px',
                        minHeight: '2px',
                        borderRadius: '2px 2px 0 0',
                        background: s[mi]?.color,
                        opacity: pct > 0 ? 1 : 0.15,
                        transition: 'height 0.4s ease',
                      }}
                    />
                  );
                })}
              </div>
              {/* month label */}
              <span
                className="text-text-faint shrink-0 mt-1 text-center"
                style={{ fontSize: '9px', lineHeight: 1.2 }}
              >
                {month}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* legend */}
      <div className="flex gap-4 mt-3">
        {legend.map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-text-faint text-xs">
            <span
              className="inline-block w-3 h-2 rounded-sm"
              style={{ background: l.color }}
            />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── dashboard page ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const supabase = createClient();
  const { fmt, convert, currency } = useCurrency();
  const [userName, setUserName] = useState('there');
  const [loading, setLoading] = useState(true);

  const [rawInvoices,   setRawInvoices]   = useState<any[]>([]);
  const [rawExpenses,   setRawExpenses]   = useState<any[]>([]);
  const [rawProjects,   setRawProjects]   = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [totalClients,  setTotalClients]  = useState(0);
  const [clientMap,     setClientMap]     = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name =
        data.user?.user_metadata?.full_name ||
        data.user?.email?.split('@')[0] ||
        'there';
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [invRes, expRes, projRes, cliRes, allCliRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id,invoice_number,status,total,amount,currency,due_date,date,created_at,client_id,type'),
        supabase.from('expenses').select('id,amount,currency,date,category'),
        supabase.from('projects').select('id,title,status,deadline,client_id'),
        supabase
          .from('clients')
          .select('id,full_name,company_name,created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('clients').select('id'),
      ]);

      const invoices = invRes.data ?? [];
      const expenses = expRes.data ?? [];
      const projects = projRes.data ?? [];

      const ids = [
        ...new Set(
          [...invoices.map((i: any) => i.client_id), ...projects.map((p: any) => p.client_id)].filter(
            Boolean
          )
        ),
      ];
      let cmap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: cls } = await supabase
          .from('clients')
          .select('id,full_name')
          .in('id', ids);
        (cls ?? []).forEach((c: any) => {
          cmap[c.id] = c.full_name;
        });
      }

      setRawInvoices(invoices);
      setRawExpenses(expenses);
      setRawProjects(projects);
      setRecentClients(cliRes.data ?? []);
      setTotalClients(allCliRes.data?.length ?? 0);
      setClientMap(cmap);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();

    const paid      = rawInvoices.filter((i: any) => i.status === 'paid' || i.status === 'Paid');
    const unpaidInv = rawInvoices.filter(
      (i: any) => i.status === 'unpaid' || i.status === 'Overdue' || i.status === 'Sent'
    );

    const conv = (v: any, cur: string) => convert(parseFloat(v ?? 0), cur || 'SAR');

    const totalRevenue  = paid.reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
    const totalExpenses = rawExpenses.reduce((s: number, e: any) => s + conv(e.amount, e.currency), 0);
    const totalProfit   = totalRevenue - totalExpenses;
    const outstanding   = unpaidInv.reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);

    const thisMonth = paid.filter((i: any) => {
      const d = new Date(i.due_date ?? i.date ?? i.created_at ?? '');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyRecurring = thisMonth.reduce(
      (s: number, i: any) => s + conv(i.total ?? i.amount, i.currency),
      0
    );

    const activeProjects    = rawProjects.filter((p: any) => p.status === 'active' || p.status === 'in_progress').length;
    const completedProjects = rawProjects.filter((p: any) => p.status === 'completed' || p.status === 'won').length;

    const upcomingDeadlines = rawProjects
      .filter((p: any) => p.deadline && new Date(p.deadline) > now)
      .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5)
      .map((p: any) => ({ ...p, client_name: clientMap[p.client_id] }));

    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return {
        key:   d.toISOString().slice(0, 7),
        label: d.toLocaleString('en', { month: 'short' }),
      };
    });

    const dateKey = (i: any) => (i.due_date ?? i.date ?? i.created_at ?? '').slice(0, 7);

    // Revenue & Profit — two series
    const revSeries: BarSeries = months.map(m => {
      const rev = paid
        .filter((i: any) => dateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
      return { label: m.label, value: rev, color: 'rgba(99,179,237,0.7)' };
    });
    const profSeries: BarSeries = months.map(m => {
      const rev = paid
        .filter((i: any) => dateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
      const exp = rawExpenses
        .filter((e: any) => (e.date ?? '').startsWith(m.key))
        .reduce((s: number, e: any) => s + conv(e.amount, e.currency), 0);
      return { label: m.label, value: Math.max(rev - exp, 0), color: 'rgba(72,187,120,0.75)' };
    });

    // Cash Flow — two series
    const incomeSeries: BarSeries = months.map(m => ({
      label: m.label,
      value: paid
        .filter((i: any) => dateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0),
      color: 'rgba(99,179,237,0.7)',
    }));
    const expSeries: BarSeries = months.map(m => ({
      label: m.label,
      value: rawExpenses
        .filter((e: any) => (e.date ?? '').startsWith(m.key))
        .reduce((s: number, e: any) => s + conv(e.amount, e.currency), 0),
      color: 'rgba(252,129,74,0.75)',
    }));

    const maxRev  = Math.max(...revSeries.map(b => b.value),  ...profSeries.map(b => b.value),  1) * 1.15;
    const maxCash = Math.max(...incomeSeries.map(b => b.value), ...expSeries.map(b => b.value), 1) * 1.15;

    return {
      totalRevenue, totalExpenses, totalProfit, outstanding,
      outstandingCount: unpaidInv.length,
      monthlyRecurring, activeProjects, completedProjects,
      upcomingDeadlines,
      unpaidInvoices: unpaidInv.map((i: any) => ({ ...i, client_name: clientMap[i.client_id] })),
      paidCount: paid.length,
      months: months.map(m => m.label),
      revSeries, profSeries, maxRev,
      incomeSeries, expSeries, maxCash,
    };
  }, [rawInvoices, rawExpenses, rawProjects, clientMap, convert, currency]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">
          Welcome back, {userName} 👋
          <span className="ml-2 text-xs text-text-faint bg-surface2 border border-border px-2 py-0.5 rounded-full">
            {currency}
          </span>
        </p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL REVENUE',        value: fmt(stats.totalRevenue),  sub: `${stats.paidCount} paid invoices`,      icon: DollarSign,   color: 'text-accent bg-accent/10' },
          { label: 'TOTAL PROFIT',         value: fmt(stats.totalProfit),   sub: 'After expenses',                        icon: TrendingUp,   color: stats.totalProfit >= 0 ? 'text-accent bg-accent/10' : 'text-red-400 bg-red-400/10' },
          { label: 'TOTAL EXPENSES',       value: fmt(stats.totalExpenses), sub: `${rawExpenses.length} expense records`, icon: TrendingDown, color: 'text-red-400 bg-red-400/10' },
          { label: 'OUTSTANDING INVOICES', value: fmt(stats.outstanding),   sub: `${stats.outstandingCount} unpaid`,      icon: AlertCircle,  color: 'text-amber-400 bg-amber-400/10' },
        ].map(card => (
          <div key={card.label} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-faint text-xs font-medium tracking-wide">{card.label}</p>
              <div className={`p-1.5 rounded-lg ${card.color}`}><card.icon size={14} /></div>
            </div>
            <p className="text-text-primary font-bold text-xl tabular-nums">{card.value}</p>
            <p className="text-text-faint text-xs mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'MONTHLY RECURRING',  value: fmt(stats.monthlyRecurring), sub: new Date().toLocaleString('en', { month: 'long' }), icon: DollarSign,  color: 'text-primary bg-primary/10' },
          { label: 'ACTIVE PROJECTS',    value: String(stats.activeProjects),    sub: 'In pipeline', icon: Briefcase,   color: 'text-blue-400 bg-blue-400/10' },
          { label: 'COMPLETED PROJECTS', value: String(stats.completedProjects), sub: 'Deals won',   icon: CheckCircle, color: 'text-accent bg-accent/10' },
          { label: 'TOTAL CLIENTS',      value: String(totalClients),            sub: `${totalClients} registered`, icon: Users, color: 'text-purple-400 bg-purple-400/10' },
        ].map(card => (
          <div key={card.label} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-faint text-xs font-medium tracking-wide">{card.label}</p>
              <div className={`p-1.5 rounded-lg ${card.color}`}><card.icon size={14} /></div>
            </div>
            <p className="text-text-primary font-bold text-xl tabular-nums">{card.value}</p>
            <p className="text-text-faint text-xs mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Revenue &amp; Profit</h2>
          <BarChart
            months={stats.months}
            series={[stats.revSeries, stats.profSeries]}
            maxVal={stats.maxRev}
            height={128}
            legend={[
              { label: 'Revenue', color: 'rgba(99,179,237,0.7)' },
              { label: 'Profit',  color: 'rgba(72,187,120,0.75)' },
            ]}
          />
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Cash Flow</h2>
          <BarChart
            months={stats.months}
            series={[stats.incomeSeries, stats.expSeries]}
            maxVal={stats.maxCash}
            height={128}
            legend={[
              { label: 'Income',   color: 'rgba(99,179,237,0.7)' },
              { label: 'Expenses', color: 'rgba(252,129,74,0.75)' },
            ]}
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Clients */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold text-sm">Recent Clients</h2>
            <Users size={14} className="text-text-faint" />
          </div>
          {recentClients.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <Users size={24} className="text-text-faint opacity-40" />
              <p className="text-text-faint text-xs">No clients yet</p>
              <Link href="/dashboard/clients" className="text-primary text-xs hover:underline">
                Add your first client →
              </Link>
            </div>
          ) : (
            recentClients.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/clients/${c.id}`}
                className="flex items-center gap-3 hover:bg-surface2 rounded-lg p-1.5 -mx-1.5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {c.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-xs font-medium truncate">{c.full_name}</p>
                  {c.company_name && (
                    <p className="text-text-faint text-xs truncate">{c.company_name}</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold text-sm">Upcoming Deadlines</h2>
            <Clock size={14} className="text-text-faint" />
          </div>
          {stats.upcomingDeadlines.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <Clock size={24} className="text-text-faint opacity-40" />
              <p className="text-text-faint text-xs">No upcoming deadlines</p>
              <Link href="/dashboard/projects" className="text-primary text-xs hover:underline">
                View projects →
              </Link>
            </div>
          ) : (
            stats.upcomingDeadlines.map((p: any) => {
              const days = Math.ceil(
                (new Date(p.deadline).getTime() - Date.now()) / 86_400_000
              );
              return (
                <div key={p.id} className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      days <= 3 ? 'bg-red-400' : days <= 7 ? 'bg-amber-400' : 'bg-accent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-xs font-medium truncate">{p.title}</p>
                    <p className="text-text-faint text-xs">
                      {days}d · {p.client_name ?? '—'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold text-sm">Unpaid Invoices</h2>
            <FileText size={14} className="text-text-faint" />
          </div>
          {stats.unpaidInvoices.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <FileText size={24} className="text-text-faint opacity-40" />
              <p className="text-text-faint text-xs">No unpaid invoices</p>
              <Link href="/dashboard/invoices" className="text-primary text-xs hover:underline">
                View invoices →
              </Link>
            </div>
          ) : (
            stats.unpaidInvoices.slice(0, 5).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-text-primary text-xs font-medium truncate">
                    {inv.invoice_number}
                  </p>
                  <p className="text-text-faint text-xs">{inv.client_name ?? '—'}</p>
                </div>
                <span className="text-amber-400 text-xs font-medium tabular-nums whitespace-nowrap">
                  {fmt(convert(parseFloat(inv.total ?? inv.amount ?? 0), inv.currency || 'SAR'))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
