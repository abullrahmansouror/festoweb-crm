'use client';

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { CashFlowChart } from '@/components/dashboard/cashflow-chart';
import { RecentClients } from '@/components/dashboard/recent-clients';
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines';
import { UnpaidInvoices } from '@/components/dashboard/unpaid-invoices';
import { createClient } from '@/lib/supabase/client';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  CheckCircle,
  Users,
} from 'lucide-react';

export default function DashboardPage() {
  const supabase = createClient();

  const [kpis, setKpis] = useState([
    { title: 'Total Revenue',        value: '...', change: '', positive: true,  icon: DollarSign,  color: 'text-accent' },
    { title: 'Total Profit',         value: '...', change: '', positive: true,  icon: TrendingUp,  color: 'text-green-400' },
    { title: 'Total Expenses',       value: '...', change: '', positive: false, icon: TrendingDown,color: 'text-red-400' },
    { title: 'Outstanding Invoices', value: '...', change: '', positive: false, icon: AlertCircle, color: 'text-warning' },
    { title: 'Monthly Recurring',    value: '...', change: '', positive: true,  icon: RefreshCw,   color: 'text-primary' },
    { title: 'Active Projects',      value: '...', change: '', positive: true,  icon: FolderOpen,  color: 'text-blue-400' },
    { title: 'Completed Projects',   value: '...', change: '', positive: true,  icon: CheckCircle, color: 'text-accent' },
    { title: 'Total Clients',        value: '...', change: '', positive: true,  icon: Users,       color: 'text-purple-400' },
  ]);

  useEffect(() => {
    async function fetchStats() {
      const [invoicesRes, clientsRes, pipelineRes] = await Promise.all([
        supabase.from('invoices').select('amount, type, status, date'),
        supabase.from('clients').select('id, created_at'),
        supabase.from('pipeline_items').select('id, status'),
      ]);

      const invoices  = invoicesRes.data  || [];
      const clients   = clientsRes.data   || [];
      const pipeline  = pipelineRes.data  || [];

      const totalRevenue  = invoices.filter(i => i.type === 'income' && i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0);
      const totalExpenses = invoices.filter(i => i.type === 'expense').reduce((s, i) => s + (i.amount || 0), 0);
      const totalProfit   = totalRevenue - totalExpenses;

      const unpaidInvoices   = invoices.filter(i => i.type === 'income' && (i.status === 'Sent' || i.status === 'Overdue'));
      const unpaidTotal      = unpaidInvoices.reduce((s, i) => s + (i.amount || 0), 0);

      // Monthly recurring = current month paid income
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthlyRecurring = invoices
        .filter(i => i.type === 'income' && i.status === 'Paid' && (i.date || '').startsWith(thisMonth))
        .reduce((s, i) => s + (i.amount || 0), 0);

      const activeProjects    = pipeline.filter(p => p.status !== 'won' && p.status !== 'lost').length;
      const completedProjects = pipeline.filter(p => p.status === 'won').length;

      const fmt = (n: number) => `SAR ${n.toLocaleString()}`;

      setKpis([
        { title: 'Total Revenue',        value: fmt(totalRevenue),   change: `${invoices.filter(i=>i.type==='income'&&i.status==='Paid').length} paid invoices`, positive: true,  icon: DollarSign,  color: 'text-accent' },
        { title: 'Total Profit',         value: fmt(totalProfit),    change: totalProfit >= 0 ? 'After expenses' : 'Net loss',                                  positive: totalProfit >= 0, icon: TrendingUp,  color: 'text-green-400' },
        { title: 'Total Expenses',       value: fmt(totalExpenses),  change: `${invoices.filter(i=>i.type==='expense').length} expense records`,               positive: false, icon: TrendingDown, color: 'text-red-400' },
        { title: 'Outstanding Invoices', value: fmt(unpaidTotal),    change: `${unpaidInvoices.length} unpaid`,                                                 positive: false, icon: AlertCircle, color: 'text-warning' },
        { title: 'Monthly Recurring',    value: fmt(monthlyRecurring),change: new Date().toLocaleString('en', {month:'long'}),                                  positive: true,  icon: RefreshCw,   color: 'text-primary' },
        { title: 'Active Projects',      value: String(activeProjects),    change: 'In pipeline',   positive: true,  icon: FolderOpen,  color: 'text-blue-400' },
        { title: 'Completed Projects',   value: String(completedProjects), change: 'Deals won',     positive: true,  icon: CheckCircle, color: 'text-accent' },
        { title: 'Total Clients',        value: String(clients.length),    change: `${clients.length} registered`, positive: true, icon: Users, color: 'text-purple-400' },
      ]);
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Welcome back, Abdulrhman 👋</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart />
        <CashFlowChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentClients />
        <UpcomingDeadlines />
        <UnpaidInvoices />
      </div>
    </div>
  );
}
