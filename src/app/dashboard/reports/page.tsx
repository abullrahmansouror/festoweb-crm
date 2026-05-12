'use client';

import { BarChart2, TrendingUp, Users, Clock } from 'lucide-react';

const months = ['Jan','Feb','Mar','Apr','May','Jun'];
const revenueData = [12000,18000,15000,22000,19000,25000];
const maxRev = Math.max(...revenueData);

const projectStats = [
  { label: 'Websites Delivered', value: 12, delta: '+3 this month' },
  { label: 'Active Projects', value: 5, delta: '2 in review' },
  { label: 'Avg. Project Value', value: 'SAR 8,200', delta: '+12% vs last month' },
  { label: 'Repeat Clients', value: '67%', delta: '8 of 12 clients' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
        <p className="text-text-muted text-sm mt-1">Business overview & analytics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {projectStats.map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-4">
            <p className="text-text-muted text-xs mb-2">{stat.label}</p>
            <p className="text-text-primary text-2xl font-bold">{stat.value}</p>
            <p className="text-accent text-xs mt-1">{stat.delta}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 size={16} className="text-primary" />
          <h2 className="text-text-primary font-semibold text-sm">Monthly Revenue (SAR)</h2>
        </div>
        <div className="flex items-end gap-3 h-40">
          {revenueData.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-text-faint text-xs tabular-nums">{(val/1000).toFixed(0)}k</span>
              <div
                className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                style={{ height: `${(val / maxRev) * 100}%`, minHeight: '4px' }}
              />
              <span className="text-text-faint text-xs">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Service breakdown */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-text-primary font-semibold text-sm mb-4">Revenue by Service</h2>
        <div className="space-y-3">
          {[
            { label: 'Website Design', pct: 42, amount: 52000 },
            { label: 'E-commerce', pct: 30, amount: 37000 },
            { label: 'Landing Pages', pct: 16, amount: 19800 },
            { label: 'Maintenance', pct: 12, amount: 14800 },
          ].map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-text-muted text-xs">{item.label}</span>
                <span className="text-text-primary text-xs font-semibold tabular-nums">SAR {item.amount.toLocaleString()} ({item.pct}%)</span>
              </div>
              <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
