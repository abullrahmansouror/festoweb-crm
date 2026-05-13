'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Briefcase, CheckCircle, Users, FileText, Clock
} from 'lucide-react';
import { useCurrency } from '@/lib/currency-context';

/* ─── robust date → "YYYY-MM" helper ─────────────────────────────────────── */
function toYearMonth(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string' && /^\d{4}-\d{2}/.test(raw)) return raw.slice(0, 7);
  const d = new Date(raw);
  if (!isNaN(d.getTime()))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (typeof raw === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) {
    const [, month, year] = raw.split('/');
    return `${year}-${month.padStart(2, '0')}`;
  }
  return '';
}

/* ─── SVG bar chart ──────────────────────────────────────────────────── */
type MonthBar = { label: string; value: number; color: string };

function BarChart({
  months,
  series,
  maxVal,
  legend,
}: {
  months: string[];
  series: MonthBar[][];
  maxVal: number;
  legend: { label: string; color: string }[];
}) {
  const hasData = series.some(s => s.some(b => Math.abs(b.value) > 0));

  const W = 600;
  const H = 140;
  const PAD_LEFT = 8;
  const PAD_RIGHT = 8;
  const PAD_BOTTOM = 22; // space for month labels
  const PAD_TOP = 8;
  const chartH = H - PAD_BOTTOM - PAD_TOP;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const n = months.length;        // 12
  const s = series.length;        // 2
  const groupW = chartW / n;
  const barW = Math.max(4, (groupW / s) * 0.72);
  const groupGap = (groupW - barW * s) / 2;

  return (
    <div>
      {!hasData ? (
        <div className="flex items-center justify-center text-text-faint text-xs" style={{ height: H }}>
          No data yet
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
          aria-hidden="true"
        >
          {/* faint horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line
              key={f}
              x1={PAD_LEFT} y1={PAD_TOP + chartH * (1 - f)}
              x2={PAD_LEFT + chartW} y2={PAD_TOP + chartH * (1 - f)}
              stroke="currentColor" strokeOpacity={0.06} strokeWidth={1}
            />
          ))}

          {months.map((month, mi) => {
            const gx = PAD_LEFT + mi * groupW;
            return (
              <g key={mi}>
                {/* month label */}
                <text
                  x={gx + groupW / 2}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="currentColor"
                  opacity={0.4}
                >
                  {month}
                </text>

                {/* bars for each series */}
                {series.map((s_data, si) => {
                  const val = s_data[mi]?.value ?? 0;
                  const absVal = Math.abs(val);
                  const pct = maxVal > 0 ? absVal / maxVal : 0;
                  const barH = Math.max(2, pct * chartH);
                  const bx = gx + groupGap + si * barW;
                  const by = PAD_TOP + chartH - barH;
                  // negative profit = orange-red
                  const fill = val < 0 ? 'rgba(252,129,74,0.85)' : s_data[mi]?.color;
                  return (
                    <rect
                      key={si}
                      x={bx} y={by}
                      width={barW - 1}
                      height={barH}
                      rx={2} ry={2}
                      fill={fill}
                      opacity={absVal > 0 ? 1 : 0.15}
                    >
                      <title>{`${month}: ${val.toLocaleString('en', { maximumFractionDigits: 0 })}`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}

      {/* legend */}
      <div className="flex gap-4 mt-2">
        {legend.map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-text-faint text-xs">
            <span className="inline-block w-3 h-2 rounded-sm" style={{ background: l.color }} />
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
      const [invRes, projRes, cliRes, allCliRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id,invoice_number,status,total,amount,currency,due_date,date,created_at,client_id,type'),
        supabase.from('projects').select('id,title,status,deadline,client_id'),
        supabase
          .from('clients')
          .select('id,full_name,company_name,created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('clients').select('id'),
      ]);

      const invoices = invRes.data ?? [];
      const projects = projRes.data ?? [];

      const ids = [
        ...new Set(
          [...invoices.map((i: any) => i.client_id), ...projects.map((p: any) => p.client_id)].filter(Boolean)
        ),
      ];
      let cmap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: cls } = await supabase.from('clients').select('id,full_name').in('id', ids);
        (cls ?? []).forEach((c: any) => { cmap[c.id] = c.full_name; });
      }

      setRawInvoices(invoices);
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
    const conv = (v: any, cur: string) => convert(parseFloat(v ?? 0), cur || 'SAR');

    const paidIncome      = rawInvoices.filter((i: any) => i.type === 'income'  && (i.status === 'paid' || i.status === 'Paid'));
    const expenseInvoices = rawInvoices.filter((i: any) => i.type === 'expense');
    const unpaidInv       = rawInvoices.filter((i: any) => i.type === 'income' && (i.status === 'unpaid' || i.status === 'Overdue' || i.status === 'Sent'));

    const totalRevenue  = paidIncome.reduce     ((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
    const totalExpenses = expenseInvoices.reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
    const totalProfit   = totalRevenue - totalExpenses;
    const outstanding   = unpaidInv.reduce      ((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);

    const thisMonth = paidIncome.filter((i: any) => {
      const d = new Date(i.date ?? i.due_date ?? i.created_at ?? '');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyRecurring = thisMonth.reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);

    const activeProjects    = rawProjects.filter((p: any) => p.status === 'active'    || p.status === 'in_progress').length;
    const completedProjects = rawProjects.filter((p: any) => p.status === 'completed' || p.status === 'won').length;

    const upcomingDeadlines = rawProjects
      .filter((p: any) => p.deadline && new Date(p.deadline) > now)
      .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5)
      .map((p: any) => ({ ...p, client_name: clientMap[p.client_id] }));

    // rolling 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { key, label: d.toLocaleString('en', { month: 'short' }) };
    });

    const invDateKey = (i: any) =>
      toYearMonth(i.date) || toYearMonth(i.due_date) || toYearMonth(i.created_at);
    const expDateKey = (i: any) =>
      toYearMonth(i.date) || toYearMonth(i.created_at);

    // Revenue & Profit series
    const revSeries: MonthBar[] = months.map(m => ({
      label: m.label,
      value: paidIncome
        .filter((i: any) => invDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0),
      color: 'rgba(99,179,237,0.85)',
    }));
    const profSeries: MonthBar[] = months.map(m => {
      const rev = paidIncome
        .filter((i: any) => invDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
      const exp = expenseInvoices
        .filter((i: any) => expDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
      return { label: m.label, value: rev - exp, color: 'rgba(72,187,120,0.85)' };
    });

    // Cash Flow series
    const incomeSeries: MonthBar[] = months.map(m => ({
      label: m.label,
      value: paidIncome
        .filter((i: any) => invDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0),
      color: 'rgba(99,179,237,0.85)',
    }));
    const expSeries: MonthBar[] = months.map(m => ({
      label: m.label,
      value: expenseInvoices
        .filter((i: any) => expDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0),
      color: 'rgba(252,129,74,0.85)',
    }));

    const maxRev  = Math.max(...revSeries.map(b => b.value), ...profSeries.map(b => Math.abs(b.value)), 1) * 1.15;
    const maxCash = Math.max(...incomeSeries.map(b => b.value), ...expSeries.map(b => b.value), 1) * 1.15;

    return {
      totalRevenue, totalExpenses, totalProfit, outstanding,
      outstandingCount: unpaidInv.length,
      monthlyRecurring, activeProjects, completedProjects,
      upcomingDeadlines,
      unpaidInvoices: unpaidInv.map((i: any) => ({ ...i, client_name: clientMap[i.client_id] })),
      paidCount: paidIncome.length,
      months: months.map(m => m.label),
      revSeries, profSeries, maxRev,
      incomeSeries, expSeries, maxCash,
    };
  }, [rawInvoices, rawProjects, clientMap, convert, currency]);

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
          <span className="ml-2 text-xs text-text-faint bg-surface2 border border-border px-2 py-0.5 rounded-full">{currency}</span>
        </p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL REVENUE',        value: fmt(stats.totalRevenue),  sub: `${stats.paidCount} paid invoices`,  icon: DollarSign,   color: 'text-accent bg-accent/10' },
          { label: 'TOTAL PROFIT',         value: fmt(stats.totalProfit),   sub: 'After expenses',                    icon: TrendingUp,   color: stats.totalProfit >= 0 ? 'text-accent bg-accent/10' : 'text-red-400 bg-red-400/10' },
          { label: 'TOTAL EXPENSES',       value: fmt(stats.totalExpenses), sub: 'From expense invoices',             icon: TrendingDown, color: 'text-red-400 bg-red-400/10' },
          { label: 'OUTSTANDING INVOICES', value: fmt(stats.outstanding),   sub: `${stats.outstandingCount} unpaid`,  icon: AlertCircle,  color: 'text-amber-400 bg-amber-400/10' },
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
            legend={[
              { label: 'Revenue', color: 'rgba(99,179,237,0.85)' },
              { label: 'Profit',  color: 'rgba(72,187,120,0.85)' },
            ]}
          />
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Cash Flow</h2>
          <BarChart
            months={stats.months}
            series={[stats.incomeSeries, stats.expSeries]}
            maxVal={stats.maxCash}
            legend={[
              { label: 'Income',   color: 'rgba(99,179,237,0.85)' },
              { label: 'Expenses', color: 'rgba(252,129,74,0.85)' },
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
              <Link href="/dashboard/clients" className="text-primary text-xs hover:underline">Add your first client →</Link>
            </div>
          ) : (
            recentClients.map(c => (
              <Link key={c.id} href={`/dashboard/clients/${c.id}`}
                className="flex items-center gap-3 hover:bg-surface2 rounded-lg p-1.5 -mx-1.5 transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {c.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-xs font-medium truncate">{c.full_name}</p>
                  {c.company_name && <p className="text-text-faint text-xs truncate">{c.company_name}</p>}
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
              <Link href="/dashboard/projects" className="text-primary text-xs hover:underline">View projects →</Link>
            </div>
          ) : (
            stats.upcomingDeadlines.map((p: any) => {
              const days = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86_400_000);
              return (
                <div key={p.id} className="flex items-center gap-3 mb-3">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${days <= 3 ? 'bg-red-400' : days <= 7 ? 'bg-amber-400' : 'bg-accent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-xs font-medium truncate">{p.title}</p>
                    <p className="text-text-faint text-xs">{days}d · {p.client_name ?? '—'}</p>
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
              <Link href="/dashboard/invoices" className="text-primary text-xs hover:underline">View invoices →</Link>
            </div>
          ) : (
            stats.unpaidInvoices.slice(0, 5).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-text-primary text-xs font-medium truncate">{inv.invoice_number}</p>
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
