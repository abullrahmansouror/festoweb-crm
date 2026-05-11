'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { CashFlowChart } from '@/components/dashboard/cashflow-chart';
import { RecentClients } from '@/components/dashboard/recent-clients';
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines';
import { UnpaidInvoices } from '@/components/dashboard/unpaid-invoices';
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
  const kpis = [
    { title: 'Total Revenue', value: 'SAR 84,500', change: '+12.5%', positive: true, icon: DollarSign, color: 'text-accent' },
    { title: 'Total Profit', value: 'SAR 61,200', change: '+8.3%', positive: true, icon: TrendingUp, color: 'text-green-400' },
    { title: 'Total Expenses', value: 'SAR 23,300', change: '+3.1%', positive: false, icon: TrendingDown, color: 'text-red-400' },
    { title: 'Outstanding Invoices', value: 'SAR 12,800', change: '4 unpaid', positive: false, icon: AlertCircle, color: 'text-warning' },
    { title: 'Monthly Recurring', value: 'SAR 6,200', change: '+2 clients', positive: true, icon: RefreshCw, color: 'text-primary' },
    { title: 'Active Projects', value: '7', change: '2 due soon', positive: true, icon: FolderOpen, color: 'text-blue-400' },
    { title: 'Completed Projects', value: '34', change: '+3 this month', positive: true, icon: CheckCircle, color: 'text-accent' },
    { title: 'Total Clients', value: '18', change: '+2 this month', positive: true, icon: Users, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Welcome back, Abdulrhman 👋</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart />
        <CashFlowChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentClients />
        <UpcomingDeadlines />
        <UnpaidInvoices />
      </div>
    </div>
  );
}
