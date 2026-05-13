'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Briefcase, CheckCircle, Users, FileText, Clock
} from 'lucide-react';
import { useCurrency } from '@/lib/currency-context';

interface Stats {
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  outstandingInvoices: number;
  outstandingCount: number;
  monthlyRecurring: number;
  activeProjects: number;
  completedProjects: number;
  totalClients: number;
  recentClients: { id: string; name: string; company?: string; created_at: string }[];
  upcomingDeadlines: { id: string; title: string; deadline?: string; client_name?: string }[];
  unpaidInvoices: { id: string; invoice_number: string; client_name?: string; total: number; currency: string; due_date?: string }[];
  revenueByMonth: { month: string; revenue: number; profit: number }[];
  cashFlow: { month: string; income: number; expenses: number }[];
}

export default function DashboardPage() {
  const supabase = createClient();
  const { fmt, convert, currency } = useCurrency();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('there');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name ||
                   data.user?.email?.split('@')[0] ||
                   'there';
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [invoicesRes, expensesRes, projectsRes, clientsRes] = await Promise.all([
        supabase.from('invoices').select('id,invoice_number,status,total,currency,due_date,client_id'),
        supabase.from('expenses').select('id,amount,currency,date,category'),
        supabase.from('projects').select('id,title,status,deadline,client_id'),
        supabase.from('clients').select('id,name,company,created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const invoices = invoicesRes.data ?? [];
      const expenses = expensesRes.data ?? [];
      const projects = projectsRes.data ?? [];
      const clients = clientsRes.data ?? [];

      // All project client names
      const clientIds = [...new Set([...invoices.map((i:any)=>i.client_id), ...projects.map((p:any)=>p.client_id)].filter(Boolean))];
      let clientMap: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: cls } = await supabase.from('clients').select('id,name').in('id', clientIds);
        (cls ?? []).forEach((c: any) => { clientMap[c.id] = c.name; });
      }

      const { data: allClients } = await supabase.from('clients').select('id');
      const totalClients = allClients?.length ?? 0;

      // Revenue = paid invoices (converted to active main currency)
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + convert(i.total ?? 0, i.currency ?? 'SAR'), 0);

      // Expenses (converted)
      const totalExpenses = expenses.reduce((s: number, e: any) => s + convert(e.amount ?? 0, e.currency ?? 'SAR'), 0);
      const totalProfit = totalRevenue - totalExpenses;

      // Outstanding
      const unpaidInvs = invoices.filter((i: any) => i.status === 'unpaid' || i.status === 'overdue');
      const outstandingInvoices = unpaidInvs.reduce((s: number, i: any) => s + convert(i.total ?? 0, i.currency ?? 'SAR'), 0);

      // Monthly recurring (subscriptions would go here, using invoices as proxy)
      const now = new Date();
      const currentMonthPaid = paidInvoices.filter((i: any) => {
        const d = new Date(i.due_date ?? '');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const monthlyRecurring = currentMonthPaid.reduce((s: number, i: any) => s + convert(i.total ?? 0, i.currency ?? 'SAR'), 0);

      // Projects
      const activeProjects = projects.filter((p: any) => p.status === 'active' || p.status === 'in_progress').length;
      const completedProjects = projects.filter((p: any) => p.status === 'completed' || p.status === 'won').length;

      // Upcoming deadlines
      const upcoming = projects
        .filter((p: any) => p.deadline && new Date(p.deadline) > now)
        .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 5)
        .map((p: any) => ({ ...p, client_name: clientMap[p.client_id] }));

      // Revenue by month (last 12)
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        return { key: d.toISOString().slice(0, 7), label: d.toLocaleString('en', { month: 'short' }) };
      });
      const revenueByMonth = months.map(m => {
        const rev = paidInvoices
          .filter((i: any) => (i.due_date ?? '').startsWith(m.key))
          .reduce((s: number, i: any) => s + convert(i.total ?? 0, i.currency ?? 'SAR'), 0);
        const exp = expenses
          .filter((e: any) => (e.date ?? '').startsWith(m.key))
          .reduce((s: number, e: any) => s + convert(e.amount ?? 0, e.currency ?? 'SAR'), 0);
        return { month: m.label, revenue: rev, profit: rev - exp };
      });

      const cashFlow = months.map(m => ({
        month: m.label,
        income: paidInvoices.filter((i:any)=>(i.due_date??'').startsWith(m.key)).reduce((s:number,i:any)=>s+convert(i.total??0,i.currency??'SAR'),0),
        expenses: expenses.filter((e:any)=>(e.date??'').startsWith(m.key)).reduce((s:number,e:any)=>s+convert(e.amount??0,e.currency??'SAR'),0),
      }));

      setStats({
        totalRevenue, totalProfit, totalExpenses,
        outstandingInvoices, outstandingCount: unpaidInvs.length,
        monthlyRecurring, activeProjects, completedProjects, totalClients,
        recentClients: clients,
        upcomingDeadlines: upcoming,
        unpaidInvoices: unpaidInvs.map((i: any) => ({ ...i, client_name: clientMap[i.client_id] })),
        revenueByMonth, cashFlow,
      });
      setLoading(false);
    }
    load();
  }, [currency, convert]); // re-run when currency changes

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-text-muted">
      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const maxRev = Math.max(...(stats?.revenueByMonth.map(m => m.revenue) ?? [1]), 1);
  const maxCash = Math.max(...(stats?.cashFlow.flatMap(m => [m.income, m.expenses]) ?? [1]), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Welcome back, {userName} 👋</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL REVENUE',         value: fmt(stats?.totalRevenue ?? 0),         sub: `${stats?.unpaidInvoices.filter(()=>true).length ?? 0} paid invoices`, icon: DollarSign,   color: 'text-accent bg-accent/10' },
          { label: 'TOTAL PROFIT',           value: fmt(stats?.totalProfit ?? 0),           sub: 'After expenses',  icon: TrendingUp,   color: (stats?.totalProfit ?? 0) >= 0 ? 'text-accent bg-accent/10' : 'text-red-400 bg-red-400/10' },
          { label: 'TOTAL EXPENSES',         value: fmt(stats?.totalExpenses ?? 0),         sub: '0 expense records', icon: TrendingDown, color: 'text-red-400 bg-red-400/10' },
          { label: 'OUTSTANDING INVOICES',   value: fmt(stats?.outstandingInvoices ?? 0),   sub: `${stats?.outstandingCount ?? 0} unpaid`, icon: AlertCircle,  color: 'text-amber-400 bg-amber-400/10' },
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'MONTHLY RECURRING',  value: fmt(stats?.monthlyRecurring ?? 0), sub: new Date().toLocaleString('en',{month:'long'}), icon: DollarSign,   color: 'text-primary bg-primary/10' },
          { label: 'ACTIVE PROJECTS',    value: String(stats?.activeProjects ?? 0),       sub: 'In pipeline',     icon: Briefcase,    color: 'text-blue-400 bg-blue-400/10' },
          { label: 'COMPLETED PROJECTS', value: String(stats?.completedProjects ?? 0),    sub: 'Deals won',       icon: CheckCircle,  color: 'text-accent bg-accent/10' },
          { label: 'TOTAL CLIENTS',      value: String(stats?.totalClients ?? 0),         sub: '0 registered',    icon: Users,        color: 'text-purple-400 bg-purple-400/10' },
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
        {/* Revenue & Profit */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Revenue &amp; Profit</h2>
          <div className="flex items-end gap-1 h-32">
            {stats?.revenueByMonth.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col justify-end gap-0.5" style={{height:'100%'}}>
                  <div className="w-full bg-primary/20 rounded-sm" style={{height:`${(m.revenue/maxRev)*100}%`,minHeight: m.revenue>0?'2px':'0'}} />
                  <div className="w-full bg-accent/40 rounded-sm" style={{height:`${(Math.max(m.profit,0)/maxRev)*100}%`,minHeight:m.profit>0?'2px':'0'}} />
                </div>
                <span className="text-text-faint" style={{fontSize:'9px'}}>{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-text-faint text-xs"><span className="w-3 h-2 rounded-sm bg-primary/20 inline-block"/>Revenue</span>
            <span className="flex items-center gap-1.5 text-text-faint text-xs"><span className="w-3 h-2 rounded-sm bg-accent/40 inline-block"/>Profit</span>
          </div>
        </div>

        {/* Cash Flow */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Cash Flow</h2>
          <div className="flex items-end gap-1 h-32">
            {stats?.cashFlow.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col justify-end gap-0.5" style={{height:'100%'}}>
                  <div className="w-full bg-blue-400/30 rounded-sm" style={{height:`${(m.income/maxCash)*100}%`,minHeight:m.income>0?'2px':'0'}} />
                  <div className="w-full bg-red-400/30 rounded-sm" style={{height:`${(m.expenses/maxCash)*100}%`,minHeight:m.expenses>0?'2px':'0'}} />
                </div>
                <span className="text-text-faint" style={{fontSize:'9px'}}>{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-text-faint text-xs"><span className="w-3 h-2 rounded-sm bg-blue-400/30 inline-block"/>Income</span>
            <span className="flex items-center gap-1.5 text-text-faint text-xs"><span className="w-3 h-2 rounded-sm bg-red-400/30 inline-block"/>Expenses</span>
          </div>
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
          {stats?.recentClients.length === 0 ? (
            <p className="text-text-faint text-xs text-center py-6">No clients yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.recentClients.map(c => (
                <Link key={c.id} href={`/dashboard/clients/${c.id}`} className="flex items-center gap-3 hover:bg-surface2 rounded-lg p-1.5 -mx-1.5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{c.name[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-xs font-medium truncate">{c.name}</p>
                    {c.company && <p className="text-text-faint text-xs truncate">{c.company}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold text-sm">Upcoming Deadlines</h2>
            <Clock size={14} className="text-text-faint" />
          </div>
          {stats?.upcomingDeadlines.length === 0 ? (
            <p className="text-text-faint text-xs text-center py-6">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3">
              {stats?.upcomingDeadlines.map(p => {
                const days = Math.ceil((new Date(p.deadline!).getTime() - Date.now()) / 86400000);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${days <= 3 ? 'bg-red-400' : days <= 7 ? 'bg-amber-400' : 'bg-accent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-xs font-medium truncate">{p.title}</p>
                      <p className="text-text-faint text-xs">{days}d · {p.client_name ?? '—'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold text-sm">Unpaid Invoices</h2>
            <FileText size={14} className="text-text-faint" />
          </div>
          {stats?.unpaidInvoices.length === 0 ? (
            <p className="text-text-faint text-xs text-center py-6">No unpaid invoices</p>
          ) : (
            <div className="space-y-3">
              {stats?.unpaidInvoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-text-primary text-xs font-medium truncate">{inv.invoice_number}</p>
                    <p className="text-text-faint text-xs">{inv.client_name ?? '—'}</p>
                  </div>
                  <span className="text-amber-400 text-xs font-medium tabular-nums whitespace-nowrap">{fmt(convert(inv.total, inv.currency))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
