'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Briefcase, CheckCircle, Users, FileText, Clock
} from 'lucide-react';
import { useCurrency } from '@/lib/currency-context';

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
  const H = 160;
  const PAD_LEFT = 10;
  const PAD_RIGHT = 10;
  const PAD_BOTTOM = 24;
  const PAD_TOP = 8;
  const chartH = H - PAD_BOTTOM - PAD_TOP;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const n = months.length;
  const s = series.length;
  const groupW = chartW / n;
  // Minimum bar width 6px, max uses 75% of group width split evenly
  const barW = Math.max(6, Math.min(18, (groupW * 0.75) / s));
  const groupGap = (groupW - barW * s) / 2;

  return (
    <div>
      {!hasData ? (
        <div
          className="flex flex-col items-center justify-center gap-2"
          style={{ height: H, color: '#555' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="12" width="4" height="9" rx="1"/>
            <rect x="10" y="7" width="4" height="14" rx="1" opacity=".4"/>
            <rect x="17" y="4" width="4" height="17" rx="1" opacity=".2"/>
          </svg>
          <span style={{ fontSize: 11 }}>No data yet</span>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
          aria-hidden="true"
        >
          {/* grid lines */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line
              key={f}
              x1={PAD_LEFT} y1={PAD_TOP + chartH * (1 - f)}
              x2={PAD_LEFT + chartW} y2={PAD_TOP + chartH * (1 - f)}
              stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1}
            />
          ))}

          {months.map((month, mi) => {
            const gx = PAD_LEFT + mi * groupW;
            return (
              <g key={mi}>
                <text
                  x={gx + groupW / 2}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#555"
                >
                  {month}
                </text>

                {series.map((s_data, si) => {
                  const val = s_data[mi]?.value ?? 0;
                  const absVal = Math.abs(val);
                  const pct = maxVal > 0 ? absVal / maxVal : 0;
                  const barH = Math.max(absVal > 0 ? 3 : 0, pct * chartH);
                  const bx = gx + groupGap + si * barW;
                  const by = PAD_TOP + chartH - barH;
                  const fill = val < 0 ? 'rgba(252,129,74,0.85)' : (s_data[mi]?.color ?? '#6366f1');
                  return (
                    <rect
                      key={si}
                      x={bx} y={by}
                      width={barW - 1}
                      height={barH}
                      rx={2} ry={2}
                      fill={fill}
                      opacity={absVal > 0 ? 1 : 0}
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

      <div className="flex gap-4 mt-2">
        {legend.map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#555' }}>
            <span style={{ display: 'inline-block', width: 10, height: 8, borderRadius: 2, background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

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

    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { key, label: d.toLocaleString('en', { month: 'short' }) };
    });

    const invDateKey = (i: any) =>
      toYearMonth(i.date) || toYearMonth(i.due_date) || toYearMonth(i.created_at);
    const expDateKey = (i: any) =>
      toYearMonth(i.date) || toYearMonth(i.created_at);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '2px solid #6366f1', borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  // Shared card style
  const card = {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: '16px 18px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f1f1' }}>Dashboard</h1>
        <p style={{ color: '#a0a0a0', fontSize: 13, marginTop: 4 }}>
          Welcome back, {userName} 👋
          <span style={{
            marginLeft: 8, fontSize: 11, color: '#555',
            background: '#222', border: '1px solid #2a2a2a',
            padding: '2px 8px', borderRadius: 999
          }}>{currency}</span>
        </p>
      </div>

      {/* KPI Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {([
          { label: 'TOTAL REVENUE',        value: fmt(stats.totalRevenue),  sub: `${stats.paidCount} paid invoices`,  Icon: DollarSign,   accent: '#10b981' },
          { label: 'TOTAL PROFIT',         value: fmt(stats.totalProfit),   sub: 'After expenses',                    Icon: TrendingUp,   accent: stats.totalProfit >= 0 ? '#10b981' : '#ef4444' },
          { label: 'TOTAL EXPENSES',       value: fmt(stats.totalExpenses), sub: 'From expense invoices',             Icon: TrendingDown, accent: '#ef4444' },
          { label: 'OUTSTANDING INVOICES', value: fmt(stats.outstanding),   sub: `${stats.outstandingCount} unpaid`,  Icon: AlertCircle,  accent: '#f59e0b' },
        ] as const).map(c => (
          <div key={c.label} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#555', letterSpacing: '0.06em' }}>{c.label}</span>
              <span style={{ background: c.accent + '18', color: c.accent, padding: '4px 6px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                <c.Icon size={13} />
              </span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#f1f1f1', fontVariantNumeric: 'tabular-nums' }}>{c.value}</p>
            <p style={{ fontSize: 11, color: '#555', marginTop: 3 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {([
          { label: 'MONTHLY RECURRING',  value: fmt(stats.monthlyRecurring), sub: new Date().toLocaleString('en', { month: 'long' }), Icon: DollarSign,  accent: '#6366f1' },
          { label: 'ACTIVE PROJECTS',    value: String(stats.activeProjects),    sub: 'In pipeline', Icon: Briefcase,   accent: '#60a5fa' },
          { label: 'COMPLETED PROJECTS', value: String(stats.completedProjects), sub: 'Deals won',   Icon: CheckCircle, accent: '#10b981' },
          { label: 'TOTAL CLIENTS',      value: String(totalClients),            sub: `${totalClients} registered`, Icon: Users, accent: '#c084fc' },
        ] as const).map(c => (
          <div key={c.label} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#555', letterSpacing: '0.06em' }}>{c.label}</span>
              <span style={{ background: c.accent + '18', color: c.accent, padding: '4px 6px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                <c.Icon size={13} />
              </span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#f1f1f1', fontVariantNumeric: 'tabular-nums' }}>{c.value}</p>
            <p style={{ fontSize: 11, color: '#555', marginTop: 3 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 14 }}>
        {[
          {
            title: 'Revenue & Profit',
            series: [stats.revSeries, stats.profSeries],
            maxVal: stats.maxRev,
            legend: [{ label: 'Revenue', color: 'rgba(99,179,237,0.85)' }, { label: 'Profit', color: 'rgba(72,187,120,0.85)' }],
          },
          {
            title: 'Cash Flow',
            series: [stats.incomeSeries, stats.expSeries],
            maxVal: stats.maxCash,
            legend: [{ label: 'Income', color: 'rgba(99,179,237,0.85)' }, { label: 'Expenses', color: 'rgba(252,129,74,0.85)' }],
          },
        ].map(ch => (
          <div key={ch.title} style={{ ...card, padding: '18px 20px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f1', marginBottom: 16 }}>{ch.title}</p>
            <BarChart
              months={stats.months}
              series={ch.series}
              maxVal={ch.maxVal}
              legend={ch.legend}
            />
          </div>
        ))}
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>

        {/* Recent Clients */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f1' }}>Recent Clients</span>
            <Users size={14} color="#555" />
          </div>
          {recentClients.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
              <Users size={24} color="#333" />
              <span style={{ fontSize: 12, color: '#555' }}>No clients yet</span>
              <Link href="/dashboard/clients" style={{ fontSize: 11, color: '#6366f1' }}>Add your first client →</Link>
            </div>
          ) : (
            recentClients.map(c => (
              <Link key={c.id} href={`/dashboard/clients/${c.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', borderRadius: 8, textDecoration: 'none', marginBottom: 4 }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {c.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#f1f1f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.full_name}</p>
                  {c.company_name && <p style={{ fontSize: 11, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company_name}</p>}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f1' }}>Upcoming Deadlines</span>
            <Clock size={14} color="#555" />
          </div>
          {stats.upcomingDeadlines.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
              <Clock size={24} color="#333" />
              <span style={{ fontSize: 12, color: '#555' }}>No upcoming deadlines</span>
              <Link href="/dashboard/projects" style={{ fontSize: 11, color: '#6366f1' }}>View projects →</Link>
            </div>
          ) : (
            stats.upcomingDeadlines.map((p: any) => {
              const days = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86_400_000);
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: days <= 3 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#10b981' }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#f1f1f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                    <p style={{ fontSize: 11, color: '#555' }}>{days}d · {p.client_name ?? '—'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Unpaid Invoices */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f1f1' }}>Unpaid Invoices</span>
            <FileText size={14} color="#555" />
          </div>
          {stats.unpaidInvoices.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
              <FileText size={24} color="#333" />
              <span style={{ fontSize: 12, color: '#555' }}>No unpaid invoices</span>
              <Link href="/dashboard/invoices" style={{ fontSize: 11, color: '#6366f1' }}>View invoices →</Link>
            </div>
          ) : (
            stats.unpaidInvoices.slice(0, 5).map((inv: any) => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#f1f1f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.invoice_number}</p>
                  <p style={{ fontSize: 11, color: '#555' }}>{inv.client_name ?? '—'}</p>
                </div>
                <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
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
