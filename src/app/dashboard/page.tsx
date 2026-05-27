'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Briefcase, CheckCircle, Users, FileText, Clock,
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

  const W = 600, H = 180;
  const PAD_LEFT = 10, PAD_RIGHT = 10, PAD_BOTTOM = 28, PAD_TOP = 12;
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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          height: H,
          color: 'rgba(255,255,255,0.18)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="12" width="4" height="9" rx="1"/>
            <rect x="10" y="7" width="4" height="14" rx="1" opacity=".4"/>
            <rect x="17" y="4" width="4" height="17" rx="1" opacity=".2"/>
          </svg>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-body)' }}>No data yet — add invoices to see charts</span>
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
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map(f => (
              <line
                key={f}
                x1={PAD_LEFT} y1={PAD_TOP + chartH * (1 - f)}
                x2={PAD_LEFT + chartW} y2={PAD_TOP + chartH * (1 - f)}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={1}
                strokeDasharray="3 4"
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
                    fill="rgba(255,255,255,0.25)"
                    fontFamily="var(--font-body)"
                  >
                    {month}
                  </text>

                  {series.map((s_data, si) => {
                    const val    = s_data[mi]?.value ?? 0;
                    const absVal = Math.abs(val);
                    const pct    = maxVal > 0 ? absVal / maxVal : 0;
                    const barH   = Math.max(absVal > 0 ? 4 : 0, pct * chartH);
                    const bx     = gx + groupGap + si * barW;
                    const by     = PAD_TOP + chartH - barH;
                    const fill   = val < 0 ? 'rgba(255,107,107,0.85)' : (s_data[mi]?.color ?? '#7c6ff7');
                    return absVal === 0 ? null : (
                      <rect
                        key={si}
                        x={bx} y={by}
                        width={barW - 2}
                        height={barH}
                        rx={3} ry={3}
                        fill={fill}
                        opacity={0.9}
                        onMouseEnter={e => {
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
              background: 'rgba(13,17,23,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '5px 10px',
              fontSize: 11,
              color: '#eef2ff',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
              fontFamily: 'var(--font-body)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {tooltip.text}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
        {legend.map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>
            <span style={{ display: 'inline-block', width: 10, height: 8, borderRadius: 3, background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const DELAY_CLASSES = [
  'delay-75', 'delay-125', 'delay-175', 'delay-225',
  'delay-275', 'delay-325', 'delay-375', 'delay-400',
];

export default function DashboardPage() {
  const supabase = createClient();
  const { fmt, convert, currency } = useCurrency();
  const [userName, setUserName]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [rawInvoices, setRawInvoices] = useState<any[]>([]);
  const [rawProjects, setRawProjects] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [totalClients, setTotalClients]   = useState(0);
  const [clientMap, setClientMap]         = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const raw =
        data.user?.user_metadata?.full_name ||
        data.user?.user_metadata?.name ||
        data.user?.email?.split('@')[0] || '';
      setUserName(raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'there');
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [invRes, projRes, cliRes, allCliRes] = await Promise.all([
        supabase.from('invoices').select('id,invoice_number,status,total,amount,currency,due_date,date,created_at,client_id,type'),
        supabase.from('projects').select('id,title,status,deadline,client_id'),
        supabase.from('clients').select('id,full_name,company_name,created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('clients').select('id'),
      ]);

      const invoices = invRes.data  ?? [];
      const projects = projRes.data ?? [];

      const ids = [...new Set([
        ...invoices.map((i: any) => i.client_id),
        ...projects.map((p: any) => p.client_id),
      ].filter(Boolean))];

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
    const now  = new Date();
    const conv = (v: any, cur: string) => convert(parseFloat(v ?? 0), cur || 'SAR');

    const paidIncome      = rawInvoices.filter((i: any) => i.type === 'income'  && (i.status === 'paid'   || i.status === 'Paid'));
    const expenseInvoices = rawInvoices.filter((i: any) => i.type === 'expense');
    const unpaidInv       = rawInvoices.filter((i: any) => i.type === 'income'  && (i.status === 'unpaid' || i.status === 'Overdue' || i.status === 'Sent'));

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

    const invDateKey = (i: any) => toYearMonth(i.date) || toYearMonth(i.due_date) || toYearMonth(i.created_at);
    const expDateKey = (i: any) => toYearMonth(i.date) || toYearMonth(i.created_at);

    const allKeys = [...paidIncome.map(invDateKey), ...expenseInvoices.map(expDateKey)].filter(Boolean);

    const endDate   = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);
    let windowStart = startDate, windowEnd = endDate;

    allKeys.forEach(k => {
      const [y, m] = k.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      if (d < windowStart) windowStart = d;
      if (d > windowEnd)   windowEnd   = d;
    });

    const months: { key: string; label: string }[] = [];
    const cur = new Date(windowStart);
    while (cur <= windowEnd) {
      months.push({
        key:   `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`,
        label: cur.toLocaleString('en', { month: 'short' }),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    while (months.length < 6) {
      const [fy, fm] = months[0].key.split('-').map(Number);
      const prev = new Date(fy, fm - 2, 1);
      months.unshift({
        key:   `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`,
        label: prev.toLocaleString('en', { month: 'short' }),
      });
    }

    const revSeries: MonthBar[]  = months.map(m => ({ label: m.label, value: paidIncome.filter((i: any) => invDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0), color: 'rgba(96,165,250,0.85)' }));
    const profSeries: MonthBar[] = months.map(m => { const rev = paidIncome.filter((i: any) => invDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0); const exp = expenseInvoices.filter((i: any) => expDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0); return { label: m.label, value: rev - exp, color: 'rgba(6,214,160,0.85)' }; });
    const incomeSeries: MonthBar[] = months.map(m => ({ label: m.label, value: paidIncome.filter((i: any) => invDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0), color: 'rgba(96,165,250,0.85)' }));
    const expSeries: MonthBar[]    = months.map(m => ({ label: m.label, value: expenseInvoices.filter((i: any) => expDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0), color: 'rgba(255,107,107,0.85)' }));

    const maxRev  = Math.max(...revSeries.map(b => b.value),    ...profSeries.map(b => Math.abs(b.value)), 1) * 1.15;
    const maxCash = Math.max(...incomeSeries.map(b => b.value), ...expSeries.map(b => b.value),            1) * 1.15;

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

  // ── Loading skeleton ───────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div className="skeleton" style={{ height: 32, width: 150, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 18, width: 220 }} />
      </div>
      {[0, 1].map(row => (
        <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 118, borderRadius: 16 }} />
          ))}
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="skeleton" style={{ height: 248, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 248, borderRadius: 16 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        ))}
      </div>
    </div>
  );

  // ── Design tokens ──────────────────────────────────
  const glass: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: '20px',
  };

  const allKpis = [
    { label: 'Total Revenue',    value: fmt(stats.totalRevenue),       sub: `${stats.paidCount} paid invoice${stats.paidCount !== 1 ? 's' : ''}`,                  Icon: DollarSign,   accent: '#06d6a0', glow: 'rgba(6,214,160,0.12)' },
    { label: 'Total Profit',     value: fmt(stats.totalProfit),        sub: 'After expenses',                                                                        Icon: TrendingUp,   accent: stats.totalProfit >= 0 ? '#06d6a0' : '#ff6b6b', glow: stats.totalProfit >= 0 ? 'rgba(6,214,160,0.12)' : 'rgba(255,107,107,0.12)' },
    { label: 'Total Expenses',   value: fmt(stats.totalExpenses),      sub: 'From expense invoices',                                                                 Icon: TrendingDown, accent: '#ff6b6b', glow: 'rgba(255,107,107,0.12)' },
    { label: 'Outstanding',      value: fmt(stats.outstanding),        sub: `${stats.outstandingCount} unpaid`,                                                      Icon: AlertCircle,  accent: '#fbbf24', glow: 'rgba(251,191,36,0.12)' },
    { label: 'Monthly',          value: fmt(stats.monthlyRecurring),   sub: new Date().toLocaleString('en', { month: 'long' }),                                      Icon: DollarSign,   accent: '#7c6ff7', glow: 'rgba(124,111,247,0.12)' },
    { label: 'Active Projects',  value: String(stats.activeProjects),  sub: 'In pipeline',                                                                           Icon: Briefcase,    accent: '#60a5fa', glow: 'rgba(96,165,250,0.12)' },
    { label: 'Completed',        value: String(stats.completedProjects), sub: 'Deals won',                                                                           Icon: CheckCircle,  accent: '#06d6a0', glow: 'rgba(6,214,160,0.12)' },
    { label: 'Total Clients',    value: String(totalClients),          sub: `${totalClients} registered`,                                                            Icon: Users,        accent: '#f472b6', glow: 'rgba(244,114,182,0.12)' },
  ];

  const panelHeader = (title: string, Icon: React.ElementType, href?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: '#7c6ff7', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
          {title}
        </span>
      </div>
      {href ? (
        <Link href={href} style={{ fontSize: 11, color: 'rgba(124,111,247,0.6)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon size={12} color="rgba(255,255,255,0.25)" />
        </Link>
      ) : (
        <Icon size={14} color="rgba(255,255,255,0.2)" />
      )}
    </div>
  );

  const emptyState = (message: string, Icon: React.ElementType, href?: string, cta?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color="rgba(255,255,255,0.2)" />
      </div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>{message}</span>
      {href && cta && (
        <Link href={href} style={{ fontSize: 12, color: '#7c6ff7', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>{cta} →</Link>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header */}
      <div className="animate-fade-up" style={{ marginBottom: 4 }}>
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#eef2ff',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        }}>
          Dashboard
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.32)',
          fontSize: 13.5,
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-body)',
        }}>
          Welcome back, {userName}
          <span style={{
            fontSize: 11,
            color: 'rgba(124,111,247,0.8)',
            background: 'rgba(124,111,247,0.1)',
            border: '1px solid rgba(124,111,247,0.2)',
            padding: '2px 10px',
            borderRadius: 999,
            letterSpacing: '0.03em',
          }}>
            {currency}
          </span>
        </p>
      </div>

      {/* KPI grid — 8 cards, 4 per row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {allKpis.map((c, i) => (
          <div
            key={c.label}
            className={`animate-fade-up ${DELAY_CLASSES[i] ?? ''}`}
            style={{
              ...glass,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 118,
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${c.accent}30`;
              e.currentTarget.style.boxShadow   = `0 4px 24px ${c.glow}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.boxShadow   = 'none';
            }}
          >
            {/* Top accent gradient line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '12%',
              right: '12%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${c.accent}70, transparent)`,
            }} />

            {/* Label + icon row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 22 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.32)',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-body)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}>
                {c.label}
              </span>
              <span style={{
                background: c.glow,
                color: c.accent,
                padding: '5px 6px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                marginLeft: 8,
              }}>
                <c.Icon size={13} />
              </span>
            </div>

            {/* Value */}
            <p style={{
              fontSize: 23,
              fontWeight: 700,
              color: '#eef2ff',
              fontFamily: 'var(--font-display)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {c.value}
            </p>

            {/* Sub label */}
            <p style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.28)',
              lineHeight: 1,
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {c.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="animate-fade-up delay-450" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          {
            title: 'Revenue & Profit',
            series: [stats.revSeries, stats.profSeries],
            maxVal: stats.maxRev,
            legend: [{ label: 'Revenue', color: 'rgba(96,165,250,0.85)' }, { label: 'Profit', color: 'rgba(6,214,160,0.85)' }],
          },
          {
            title: 'Cash Flow',
            series: [stats.incomeSeries, stats.expSeries],
            maxVal: stats.maxCash,
            legend: [{ label: 'Income', color: 'rgba(96,165,250,0.85)' }, { label: 'Expenses', color: 'rgba(255,107,107,0.85)' }],
          },
        ].map(ch => (
          <div key={ch.title} style={glass}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: '#7c6ff7', flexShrink: 0 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                {ch.title}
              </p>
            </div>
            <BarChart months={stats.months} series={ch.series} maxVal={ch.maxVal} legend={ch.legend} />
          </div>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="animate-fade-up delay-600" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

        {/* Recent Clients */}
        <div style={glass}>
          {panelHeader('Recent Clients', Users, '/dashboard/clients')}
          {recentClients.length === 0 ? (
            emptyState('No clients yet', Users, '/dashboard/clients', 'Add your first client')
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentClients.map(c => (
                <Link
                  key={c.id}
                  href={`/dashboard/clients/${c.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 8px', borderRadius: 10, textDecoration: 'none', background: 'transparent', transition: 'background 0.15s', margin: '0 -8px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(124,111,247,0.2), rgba(124,111,247,0.06))', border: '1px solid rgba(124,111,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a89ff9', fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-display)' }}>
                    {c.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#eef2ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{c.full_name}</p>
                    {c.company_name && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{c.company_name}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div style={glass}>
          {panelHeader('Upcoming Deadlines', Clock)}
          {stats.upcomingDeadlines.length === 0 ? (
            emptyState('No upcoming deadlines', Clock)
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.upcomingDeadlines.map(p => (
                <Link
                  key={p.id}
                  href="/dashboard/pipeline"
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 8px', borderRadius: 10, textDecoration: 'none', background: 'transparent', transition: 'background 0.15s', margin: '0 -8px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
                    <Clock size={13} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#eef2ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{p.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(251,191,36,0.6)', marginTop: 1, fontFamily: 'var(--font-body)' }}>
                      {new Date(p.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Invoices */}
        <div style={glass}>
          {panelHeader('Unpaid Invoices', FileText, '/dashboard/finance')}
          {stats.unpaidInvoices.length === 0 ? (
            emptyState('No unpaid invoices', FileText)
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.unpaidInvoices.slice(0, 5).map((inv: any) => (
                <Link
                  key={inv.id}
                  href="/dashboard/finance"
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 8px', borderRadius: 10, textDecoration: 'none', background: 'transparent', transition: 'background 0.15s', margin: '0 -8px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b', flexShrink: 0 }}>
                    <FileText size={13} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#eef2ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                      {inv.client_name ?? 'Unknown'} — #{inv.invoice_number ?? inv.id?.slice(0, 6)}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,107,107,0.75)', marginTop: 1, fontFamily: 'var(--font-body)' }}>
                      {fmt(convert(inv.total ?? inv.amount, inv.currency || 'SAR'))}
                    </p>
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
