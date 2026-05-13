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
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const hasData = series.some(s => s.some(b => Math.abs(b.value) > 0));

  const W = 600;
  const H = 180;
  const PAD_LEFT = 10;
  const PAD_RIGHT = 10;
  const PAD_BOTTOM = 28;
  const PAD_TOP = 12;
  const chartH = H - PAD_BOTTOM - PAD_TOP;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const n = months.length;
  const s = series.length;
  const groupW = chartW / n;
  const barW = Math.max(8, Math.min(22, (groupW * 0.72) / s));
  const groupGap = (groupW - barW * s) / 2;

  return (
    <div style={{ position: 'relative' }}>
      {!hasData ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: H, color: '#444' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="12" width="4" height="9" rx="1"/>
            <rect x="10" y="7" width="4" height="14" rx="1" opacity=".4"/>
            <rect x="17" y="4" width="4" height="17" rx="1" opacity=".2"/>
          </svg>
          <span style={{ fontSize: 12 }}>No data yet — add invoices to see charts</span>
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
            aria-hidden="true"
            onMouseLeave={() => setTooltip(null)}
          >
            {[0.25, 0.5, 0.75, 1].map(f => (
              <line
                key={f}
                x1={PAD_LEFT} y1={PAD_TOP + chartH * (1 - f)}
                x2={PAD_LEFT + chartW} y2={PAD_TOP + chartH * (1 - f)}
                stroke="#ffffff" strokeOpacity={0.04} strokeWidth={1}
              />
            ))}

            {months.map((month, mi) => {
              const gx = PAD_LEFT + mi * groupW;
              return (
                <g key={mi}>
                  <text
                    x={gx + groupW / 2}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize={n > 8 ? 8 : 10}
                    fill="#555"
                  >
                    {month}
                  </text>

                  {series.map((s_data, si) => {
                    const val = s_data[mi]?.value ?? 0;
                    const absVal = Math.abs(val);
                    const pct = maxVal > 0 ? absVal / maxVal : 0;
                    const barH = Math.max(absVal > 0 ? 4 : 0, pct * chartH);
                    const bx = gx + groupGap + si * barW;
                    const by = PAD_TOP + chartH - barH;
                    const fill = val < 0 ? 'rgba(252,129,74,0.9)' : (s_data[mi]?.color ?? '#6366f1');
                    return absVal === 0 ? null : (
                      <rect
                        key={si}
                        x={bx} y={by}
                        width={barW - 2}
                        height={barH}
                        rx={3} ry={3}
                        fill={fill}
                        opacity={0.9}
                        onMouseEnter={(e) => {
                          const svg = (e.target as SVGElement).closest('svg');
                          const rect = svg?.getBoundingClientRect();
                          const svgW = rect?.width ?? W;
                          const scaleX = svgW / W;
                          setTooltip({
                            x: (bx + barW / 2) * scaleX,
                            y: by * (svgW / W) - 10,
                            text: `${legend[si]?.label ?? ''}: ${val.toLocaleString('en', { maximumFractionDigits: 0 })}`,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {tooltip && (
            <div style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
              background: '#111',
              border: '1px solid #2a2a2a',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              color: '#f1f1f1',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}>
              {tooltip.text}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {legend.map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#666' }}>
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
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  const [rawInvoices,   setRawInvoices]   = useState<any[]>([]);
  const [rawProjects,   setRawProjects]   = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [totalClients,  setTotalClients]  = useState(0);
  const [clientMap,     setClientMap]     = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const raw =
        data.user?.user_metadata?.full_name ||
        data.user?.user_metadata?.name ||
        data.user?.email?.split('@')[0] ||
        '';
      const name = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'there';
      setUserName(name);
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

    const invDateKey = (i: any) =>
      toYearMonth(i.date) || toYearMonth(i.due_date) || toYearMonth(i.created_at);
    const expDateKey = (i: any) =>
      toYearMonth(i.date) || toYearMonth(i.created_at);

    const allKeys = [
      ...paidIncome.map(invDateKey),
      ...expenseInvoices.map(expDateKey),
    ].filter(Boolean);

    const endDate   = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    let windowStart = startDate;
    let windowEnd   = endDate;
    allKeys.forEach(k => {
      const [y, m] = k.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      if (d < windowStart) windowStart = d;
      if (d > windowEnd)   windowEnd   = d;
    });

    const months: { key: string; label: string }[] = [];
    const cur = new Date(windowStart);
    while (cur <= windowEnd) {
      const key   = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      const label = cur.toLocaleString('en', { month: 'short' });
      months.push({ key, label });
      cur.setMonth(cur.getMonth() + 1);
    }

    while (months.length < 6) {
      const first = months[0];
      const [fy, fm] = first.key.split('-').map(Number);
      const prev = new Date(fy, fm - 2, 1);
      const key   = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      const label = prev.toLocaleString('en', { month: 'short' });
      months.unshift({ key, label });
    }

    const revSeries: MonthBar[] = months.map(m => ({
      label: m.label,
      value: paidIncome
        .filter((i: any) => invDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0),
      color: 'rgba(99,179,237,0.9)',
    }));
    const profSeries: MonthBar[] = months.map(m => {
      const rev = paidIncome
        .filter((i: any) => invDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
      const exp = expenseInvoices
        .filter((i: any) => expDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
      return { label: m.label, value: rev - exp, color: 'rgba(72,187,120,0.9)' };
    });

    const incomeSeries: MonthBar[] = months.map(m => ({
      label: m.label,
      value: paidIncome
        .filter((i: any) => invDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0),
      color: 'rgba(99,179,237,0.9)',
    }));
    const expSeries: MonthBar[] = months.map(m => ({
      label: m.label,
      value: expenseInvoices
        .filter((i: any) => expDateKey(i) === m.key)
        .reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0),
      color: 'rgba(252,129,74,0.9)',
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

  const card: React.CSSProperties = {
    background: '#1a1a1a',
    border: '1px solid #252525',
    borderRadius: 14,
    padding: '18px 20px',
  };

  // All 8 KPI cards in two rows of 4
  const row1 = [
    { label: 'Total Revenue',        value: fmt(stats.totalRevenue),  sub: `${stats.paidCount} paid invoice${stats.paidCount !== 1 ? 's' : ''}`,  Icon: DollarSign,   accent: '#10b981' },
    { label: 'Total Profit',         value: fmt(stats.totalProfit),   sub: 'After expenses',                    Icon: TrendingUp,   accent: stats.totalProfit >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Total Expenses',       value: fmt(stats.totalExpenses), sub: 'From expense invoices',             Icon: TrendingDown, accent: '#ef4444' },
    { label: 'Outstanding',          value: fmt(stats.outstanding),   sub: `${stats.outstandingCount} unpaid`,  Icon: AlertCircle,  accent: '#f59e0b' },
  ];

  const row2 = [
    { label: 'Monthly Recurring',  value: fmt(stats.monthlyRecurring), sub: new Date().toLocaleString('en', { month: 'long' }), Icon: DollarSign,  accent: '#6366f1' },
    { label: 'Active Projects',    value: String(stats.activeProjects),    sub: 'In pipeline', Icon: Briefcase,   accent: '#60a5fa' },
    { label: 'Completed Projects', value: String(stats.completedProjects), sub: 'Deals won',   Icon: CheckCircle, accent: '#10b981' },
    { label: 'Total Clients',      value: String(totalClients),            sub: `${totalClients} registered`, Icon: Users, accent: '#c084fc' },
  ];

  const kpiCardStyle: React.CSSProperties = {
    ...card,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 110,
    boxSizing: 'border-box',
  };

  const renderKpiRow = (items: typeof row1) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
    }}>
      {items.map(c => (
        <div key={c.label} style={kpiCardStyle}>
          {/* Top: label + icon — fixed height row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            height: 22,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#888',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1,
              flex: 1,
              minWidth: 0,
            }}>
              {c.label}
            </span>
            <span style={{
              background: c.accent + '1a',
              color: c.accent,
              padding: '5px 6px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              marginLeft: 8,
            }}>
              <c.Icon size={14} />
            </span>
          </div>
          {/* Value */}
          <p style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#f1f1f1',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            marginBottom: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {c.value}
          </p>
          {/* Sub label */}
          <p style={{
            fontSize: 12,
            color: '#666',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {c.sub}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f1f1', lineHeight: 1.2 }}>Dashboard</h1>
        <p style={{ color: '#777', fontSize: 13, marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
          Welcome back, {userName} 👋
          <span style={{
            fontSize: 11, color: '#888',
            background: '#252525', border: '1px solid #2e2e2e',
            padding: '2px 10px', borderRadius: 999
          }}>{currency}</span>
        </p>
      </div>

      {/* KPI Row 1 */}
      {renderKpiRow(row1)}

      {/* KPI Row 2 */}
      {renderKpiRow(row2)}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          {
            title: 'Revenue & Profit',
            series: [stats.revSeries, stats.profSeries],
            maxVal: stats.maxRev,
            legend: [{ label: 'Revenue', color: 'rgba(99,179,237,0.9)' }, { label: 'Profit', color: 'rgba(72,187,120,0.9)' }],
          },
          {
            title: 'Cash Flow',
            series: [stats.incomeSeries, stats.expSeries],
            maxVal: stats.maxCash,
            legend: [{ label: 'Income', color: 'rgba(99,179,237,0.9)' }, { label: 'Expenses', color: 'rgba(252,129,74,0.9)' }],
          },
        ].map(ch => (
          <div key={ch.title} style={{ ...card }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', marginBottom: 16 }}>{ch.title}</p>
            <BarChart
              months={stats.months}
              series={ch.series}
              maxVal={ch.maxVal}
              legend={ch.legend}
            />
          </div>
        ))}
      </div>

      {/* Bottom Row — equal 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

        {/* Recent Clients */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>Recent Clients</span>
            <Users size={15} color="#555" />
          </div>
          {recentClients.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="#444" />
              </div>
              <span style={{ fontSize: 12, color: '#555', textAlign: 'center' }}>No clients yet</span>
              <Link href="/dashboard/clients" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>Add your first client →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentClients.map(c => (
                <Link key={c.id} href={`/dashboard/clients/${c.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, textDecoration: 'none', background: 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {c.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.full_name}</p>
                    {c.company_name && <p style={{ fontSize: 11, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company_name}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>Upcoming Deadlines</span>
            <Clock size={15} color="#555" />
          </div>
          {stats.upcomingDeadlines.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} color="#444" />
              </div>
              <span style={{ fontSize: 12, color: '#555', textAlign: 'center' }}>No upcoming deadlines</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {stats.upcomingDeadlines.map(p => (
                <Link key={p.id} href={`/dashboard/pipeline`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, textDecoration: 'none', background: 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
                    <Clock size={13} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                    <p style={{ fontSize: 11, color: '#555' }}>{new Date(p.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Invoices */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>Unpaid Invoices</span>
            <FileText size={15} color="#555" />
          </div>
          {stats.unpaidInvoices.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="#444" />
              </div>
              <span style={{ fontSize: 12, color: '#555', textAlign: 'center' }}>No unpaid invoices</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {stats.unpaidInvoices.slice(0, 5).map((inv: any) => (
                <Link key={inv.id} href={`/dashboard/finance`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, textDecoration: 'none', background: 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                    <FileText size={13} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv.client_name ?? 'Unknown'} — #{inv.invoice_number ?? inv.id?.slice(0, 6)}
                    </p>
                    <p style={{ fontSize: 11, color: '#ef4444' }}>{fmt(convert(inv.total ?? inv.amount, inv.currency || 'SAR'))}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
