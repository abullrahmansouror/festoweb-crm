'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, FileText,
  FolderOpen, CheckCircle, Users, AlertCircle
} from 'lucide-react';

const monthlyData = [
  { month: 'Jan', revenue: 18000, expenses: 6000, profit: 12000 },
  { month: 'Feb', revenue: 22000, expenses: 7500, profit: 14500 },
  { month: 'Mar', revenue: 19000, expenses: 5000, profit: 14000 },
  { month: 'Apr', revenue: 31000, expenses: 9000, profit: 22000 },
  { month: 'May', revenue: 27000, expenses: 8000, profit: 19000 },
  { month: 'Jun', revenue: 35000, expenses: 11000, profit: 24000 },
];

const clientGrowthData = [
  { month: 'Jan', clients: 3 },
  { month: 'Feb', clients: 5 },
  { month: 'Mar', clients: 7 },
  { month: 'Apr', clients: 9 },
  { month: 'May', clients: 12 },
  { month: 'Jun', clients: 15 },
];

function KPICard({ title, value, icon: Icon, color, sub }: any) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-text-muted text-xs mb-1">{title}</p>
        <p className="text-text-primary text-xl font-bold">{value}</p>
        {sub && <p className="text-text-faint text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0, totalProfit: 0, totalExpenses: 0,
    outstandingInvoices: 0, activeProjects: 0, completedProjects: 0,
    totalClients: 0, overdueInvoices: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const [invoicesRes, projectsRes, expensesRes, clientsRes] = await Promise.all([
        supabase.from('invoices').select('total, status'),
        supabase.from('projects').select('status, budget, cost'),
        supabase.from('expenses').select('amount'),
        supabase.from('clients').select('id'),
      ]);
      const invoices = invoicesRes.data || [];
      const projects = projectsRes.data || [];
      const expenses = expensesRes.data || [];
      const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      setStats({
        totalRevenue,
        totalProfit: totalRevenue - totalExpenses,
        totalExpenses,
        outstandingInvoices: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.total), 0),
        activeProjects: projects.filter(p => p.status === 'in_progress' || p.status === 'pending').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        totalClients: clientsRes.data?.length || 0,
        overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Welcome back, Abdulrhman 👋</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="bg-primary" />
        <KPICard title="Total Profit" value={formatCurrency(stats.totalProfit)} icon={TrendingUp} color="bg-accent" />
        <KPICard title="Total Expenses" value={formatCurrency(stats.totalExpenses)} icon={TrendingDown} color="bg-error" />
        <KPICard title="Outstanding" value={formatCurrency(stats.outstandingInvoices)} icon={FileText} color="bg-warning" sub={`${stats.overdueInvoices} overdue`} />
        <KPICard title="Active Projects" value={stats.activeProjects} icon={FolderOpen} color="bg-blue-600" />
        <KPICard title="Completed" value={stats.completedProjects} icon={CheckCircle} color="bg-green-600" />
        <KPICard title="Total Clients" value={stats.totalClients} icon={Users} color="bg-purple-600" />
        <KPICard title="Overdue Invoices" value={stats.overdueInvoices} icon={AlertCircle} color="bg-red-700" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-text-primary font-semibold mb-4">Revenue & Profit</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="month" stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <YAxis stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f1f1f1' }} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenue)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-text-primary font-semibold mb-4">Monthly Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="month" stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <YAxis stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f1f1f1' }} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-text-primary font-semibold mb-4">Client Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={clientGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="month" stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <YAxis stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f1f1f1' }} />
              <Line type="monotone" dataKey="clients" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-text-primary font-semibold mb-4">Cash Flow</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="month" stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <YAxis stroke="#555" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f1f1f1' }} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4,4,0,0]} name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4,4,0,0]} name="Expenses" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
