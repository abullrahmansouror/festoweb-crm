'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Briefcase, CheckCircle, Users, FileText, Clock, ArrowUpRight, ArrowDownRight,
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

const DELAY_CLASSES = ['delay-75','delay-125','delay-175','delay-225','delay-275','delay-325','delay-375','delay-400'];

export default function DashboardPage() {
  const supabase = createClient();
  const { fmt, convert, currency } = useCurrency();
  const [userName, setUserName]           = useState('');
  const [loading, setLoading]             = useState(true);
  const [rawInvoices, setRawInvoices]     = useState<any[]>([]);
  const [rawProjects, setRawProjects]     = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [totalClients, setTotalClients]   = useState(0);
  const [clientMap, setClientMap]         = useState<Record<string, string>>({});
  const [chartTab, setChartTab]           = useState<'revenue' | 'cashflow'>('revenue');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const raw = data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || data.user?.email?.split('@')[0] || '';
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
      const ids = [...new Set([...invoices.map((i: any) => i.client_id), ...projects.map((p: any) => p.client_id)].filter(Boolean))];
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

    const invDateKey = (i: any) => toYearMonth(i.date) || toYearMonth(i.due_date) || toYearMonth(i.created_at);
    const expDateKey = (i: any) => toYearMonth(i.date) || toYearMonth(i.created_at);

    const paidIncome      = rawInvoices.filter((i: any) => i.type === 'income'  && (i.status === 'paid'   || i.status === 'Paid'));
    const expenseInvoices = rawInvoices.filter((i: any) => i.type === 'expense');
    const unpaidInv       = rawInvoices.filter((i: any) => i.type === 'income'  && (i.status === 'unpaid' || i.status === 'Overdue' || i.status === 'Sent'));

    const totalRevenue  = paidIncome.reduce     ((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
    const totalExpenses = expenseInvoices.reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
    const outstanding   = unpaidInv.reduce      ((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);

    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr  = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const monthlyRevenue    = paidIncome.filter((i: any) => invDateKey(i) === thisMonthStr).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
    const thisMonthExpenses = expenseInvoices.filter((i: any) => expDateKey(i) === thisMonthStr).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
    const monthlyProfit     = monthlyRevenue - thisMonthExpenses;

    const lastMonthRevenue  = paidIncome.filter((i: any) => invDateKey(i) === lastMonthStr).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
    const lastMonthExpenses = expenseInvoices.filter((i: any) => expDateKey(i) === lastMonthStr).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0);
    const lastMonthProfit   = lastMonthRevenue - lastMonthExpenses;

    const calcTrend = (cur: number, prev: number): number | null =>
      prev > 0 ? Math.round((cur - prev) / prev * 100) : null;

    const trendRevenue  = calcTrend(monthlyRevenue,    lastMonthRevenue);
    const trendExpenses = calcTrend(thisMonthExpenses, lastMonthExpenses);
    const trendProfit   = calcTrend(monthlyProfit,     lastMonthProfit);

    const activeProjects    = rawProjects.filter((p: any) => p.status === 'active'    || p.status === 'in_progress').length;
    const completedProjects = rawProjects.filter((p: any) => p.status === 'completed' || p.status === 'won').length;

    const upcomingDeadlines = rawProjects
      .filter((p: any) => p.deadline && new Date(p.deadline) > now)
      .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5)
      .map((p: any) => ({ ...p, client_name: clientMap[p.client_id] }));

    // Build months window
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
      months.push({ key: `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`, label: cur.toLocaleString('en', { month: 'short' }) });
      cur.setMonth(cur.getMonth() + 1);
    }
    while (months.length < 6) {
      const [fy, fm] = months[0].key.split('-').map(Number);
      const prev = new Date(fy, fm - 2, 1);
      months.unshift({ key: `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}`, label: prev.toLocaleString('en', { month: 'short' }) });
    }

    const revenueChartData = months.map(m => ({
      month:   m.label,
      Revenue: Math.round(paidIncome.filter((i: any) => invDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0)),
      Profit:  Math.round(paidIncome.filter((i: any) => invDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0) - expenseInvoices.filter((i: any) => expDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0)),
    }));
    const cashflowChartData = months.map(m => ({
      month:    m.label,
      Income:   Math.round(paidIncome.filter((i: any) => invDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0)),
      Expenses: Math.round(expenseInvoices.filter((i: any) => expDateKey(i) === m.key).reduce((s: number, i: any) => s + conv(i.total ?? i.amount, i.currency), 0)),
    }));

    return {
      totalRevenue, totalExpenses, totalProfit: totalRevenue - totalExpenses, outstanding,
      outstandingCount: unpaidInv.length,
      monthlyRevenue, monthlyProfit, thisMonthExpenses,
      trendRevenue, trendExpenses, trendProfit,
      activeProjects, completedProjects,
      upcomingDeadlines,
      unpaidInvoices: unpaidInv.map((i: any) => ({ ...i, client_name: clientMap[i.client_id] })),
      paidCount: paidIncome.length,
      revenueChartData, cashflowChartData,
      thisMonthLabel: now.toLocaleString('en', { month: 'long' }),
    };
  }, [rawInvoices, rawProjects, clientMap, convert, currency]);

  // ── Loading skeleton ──────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><div className="skeleton" style={{ height: 32, width: 160, marginBottom: 10 }} /><div className="skeleton" style={{ height: 18, width: 240 }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
      </div>
      <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  // ── Design helpers ────────────────────────────────
  const glass: React.CSSProperties = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '20px',
  };

  const TrendBadge = ({ trend, inverse = false }: { trend: number | null; inverse?: boolean }) => {
    if (trend === null) return null;
    const positive = inverse ? trend < 0 : trend >= 0;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
        background: positive ? 'rgba(6,214,160,0.12)' : 'rgba(255,107,107,0.12)',
        color:      positive ? '#06d6a0'               : '#ff6b6b',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.01em',
        flexShrink: 0,
      }}>
        {positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {Math.abs(trend)}%
      </span>
    );
  };

  const kpiItems = [
    { label: 'Monthly Revenue',  value: fmt(stats.monthlyRevenue),       trend: stats.trendRevenue,   sub: `${stats.thisMonthLabel}`,          Icon: DollarSign,   accent: '#06d6a0', glow: 'rgba(6,214,160,0.12)',       trendInverse: false },
    { label: 'Monthly Profit',   value: fmt(stats.monthlyProfit),        trend: stats.trendProfit,    sub: 'After monthly costs',              Icon: TrendingUp,   accent: stats.monthlyProfit >= 0 ? '#06d6a0' : '#ff6b6b', glow: stats.monthlyProfit >= 0 ? 'rgba(6,214,160,0.12)' : 'rgba(255,107,107,0.12)', trendInverse: false },
    { label: 'Total Revenue',    value: fmt(stats.totalRevenue),         trend: null,                 sub: `${stats.paidCount} paid invoices`, Icon: DollarSign,   accent: '#60a5fa', glow: 'rgba(96,165,250,0.12)',       trendInverse: false },
    { label: 'Outstanding',      value: fmt(stats.outstanding),          trend: null,                 sub: `${stats.outstandingCount} unpaid`, Icon: AlertCircle,  accent: '#fbbf24', glow: 'rgba(251,191,36,0.12)',       trendInverse: false },
    { label: 'Total Expenses',   value: fmt(stats.totalExpenses),        trend: stats.trendExpenses,  sub: 'All expense invoices',             Icon: TrendingDown, accent: '#ff6b6b', glow: 'rgba(255,107,107,0.12)',      trendInverse: true  },
    { label: 'Active Projects',  value: String(stats.activeProjects),    trend: null,                 sub: 'In pipeline',                     Icon: Briefcase,    accent: '#7c6ff7', glow: 'rgba(124,111,247,0.12)',      trendInverse: false },
    { label: 'Completed',        value: String(stats.completedProjects), trend: null,                 sub: 'Deals won',                       Icon: CheckCircle,  accent: '#06d6a0', glow: 'rgba(6,214,160,0.12)',        trendInverse: false },
    { label: 'Total Clients',    value: String(totalClients),            trend: null,                 sub: `${totalClients} registered`,      Icon: Users,        accent: '#f472b6', glow: 'rgba(244,114,182,0.12)',      trendInverse: false },
  ];

  const panelHeader = (title: string, Icon: React.ElementType) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: '#7c6ff7', flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', flex: 1 }}>{title}</span>
      <Icon size={14} color="rgba(255,255,255,0.2)" />
    </div>
  );

  const emptyState = (msg: string, Icon: React.ElementType, href?: string, cta?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color="rgba(255,255,255,0.2)" />
      </div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>{msg}</span>
      {href && cta && <Link href={href} style={{ fontSize: 12, color: '#7c6ff7', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>{cta} →</Link>}
    </div>
  );

  const hasChartData =
    chartTab === 'revenue'
      ? stats.revenueChartData.some(d => d.Revenue > 0 || d.Profit > 0)
      : stats.cashflowChartData.some(d => d.Income > 0 || d.Expenses > 0);

  // ── Render ────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Page header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#eef2ff', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Dashboard
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 13.5, marginTop: 5, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)' }}>
            Welcome back, {userName}
            <span style={{ fontSize: 11, color: 'rgba(124,111,247,0.85)', background: 'rgba(124,111,247,0.1)', border: '1px solid rgba(124,111,247,0.2)', padding: '2px 10px', borderRadius: 999, letterSpacing: '0.03em' }}>
              {currency}
            </span>
          </p>
        </div>
        {/* Last updated badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#06d6a0', boxShadow: '0 0 6px rgba(6,214,160,0.7)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>Live</span>
        </div>
      </div>

      {/* KPI grid — 8 compact cards in 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {kpiItems.map((c, i) => (
          <div
            key={c.label}
            className={`animate-fade-up ${DELAY_CLASSES[i] ?? ''}`}
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${c.accent}35`; e.currentTarget.style.boxShadow = `0 4px 20px ${c.glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${c.accent}65, transparent)` }} />

            {/* Icon */}
            <div style={{ width: 38, height: 38, borderRadius: 11, background: c.glow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <c.Icon size={17} color={c.accent} />
            </div>

            {/* Content */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 5 }}>
                {c.label}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 21, fontWeight: 700, color: '#eef2ff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {c.value}
                </p>
                <TrendBadge trend={c.trend} inverse={c.trendInverse} />
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="animate-fade-up delay-450" style={glass}>
        {/* Chart header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: '#7c6ff7', flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
              {chartTab === 'revenue' ? 'Revenue & Profit' : 'Cash Flow'}
            </p>
          </div>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['revenue', 'cashflow'] as const).map(tab => (
              <button key={tab} onClick={() => setChartTab(tab)}
                style={{
                  padding: '5px 13px', borderRadius: 7, fontSize: 11.5, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                  background: chartTab === tab ? 'rgba(124,111,247,0.15)' : 'transparent',
                  color:      chartTab === tab ? '#a89ff9'                : 'rgba(255,255,255,0.32)',
                }}
              >
                {tab === 'revenue' ? 'Revenue & Profit' : 'Cash Flow'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart legend */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 16 }}>
          {(chartTab === 'revenue'
            ? [['Revenue', '#60a5fa'], ['Profit', '#06d6a0']]
            : [['Income', '#60a5fa'], ['Expenses', '#ff6b6b']]
          ).map(([label, color]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
              <span style={{ display: 'inline-block', width: 24, height: 2, borderRadius: 1, background: color as string }} />
              {label}
            </span>
          ))}
        </div>

        {/* Recharts area chart */}
        {!hasChartData ? (
          <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.18)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-body)' }}>No data yet — add invoices to see charts</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={chartTab === 'revenue' ? stats.revenueChartData : stats.cashflowChartData}
              margin={{ top: 5, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={chartTab === 'revenue' ? '#06d6a0' : '#ff6b6b'} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={chartTab === 'revenue' ? '#06d6a0' : '#ff6b6b'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 5" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'var(--font-body)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'var(--font-body)' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                width={34}
              />
              <Tooltip
                contentStyle={{ background: 'rgba(13,17,23,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontFamily: 'var(--font-body)', fontSize: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#eef2ff', padding: '2px 0' }}
                labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontSize: 11 }}
                cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }}
              />
              {chartTab === 'revenue' ? (
                <>
                  <Area type="monotone" dataKey="Revenue" stroke="#60a5fa" strokeWidth={2} fill="url(#ga)" dot={false} activeDot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="Profit"  stroke="#06d6a0" strokeWidth={2} fill="url(#gb)" dot={false} activeDot={{ r: 4, fill: '#06d6a0', strokeWidth: 0 }} />
                </>
              ) : (
                <>
                  <Area type="monotone" dataKey="Income"   stroke="#60a5fa" strokeWidth={2} fill="url(#ga)" dot={false} activeDot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="Expenses" stroke="#ff6b6b" strokeWidth={2} fill="url(#gb)" dot={false} activeDot={{ r: 4, fill: '#ff6b6b', strokeWidth: 0 }} />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom panels */}
      <div className="animate-fade-up delay-600" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

        {/* Recent Clients */}
        <div style={glass}>
          {panelHeader('Recent Clients', Users)}
          {recentClients.length === 0 ? emptyState('No clients yet', Users, '/dashboard/clients', 'Add your first client') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentClients.map(c => (
                <Link key={c.id} href={`/dashboard/clients/${c.id}`}
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
          {stats.upcomingDeadlines.length === 0 ? emptyState('No upcoming deadlines', Clock) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.upcomingDeadlines.map(p => (
                <Link key={p.id} href="/dashboard/pipeline"
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
          {panelHeader('Unpaid Invoices', FileText)}
          {stats.unpaidInvoices.length === 0 ? emptyState('No unpaid invoices', FileText) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.unpaidInvoices.slice(0, 5).map((inv: any) => (
                <Link key={inv.id} href="/dashboard/finance"
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
