'use client';

import { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportsPage() {
  const supabase = createClient();

  const [kpis, setKpis] = useState({ delivered: 0, active: 0, avgValue: 0, repeatPct: 0, totalClients: 0, repeatClients: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; value: number }[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<{ label: string; amount: number; pct: number }[]>([]);

  useEffect(() => {
    // KPIs
    Promise.all([
      supabase.from('pipeline_items').select('id, status, value').eq('status', 'won'),
      supabase.from('pipeline_items').select('id, status').not('status', 'in', '("won","lost")'),
      supabase.from('clients').select('id'),
    ]).then(([won, active, clients]) => {
      const wonItems = won.data || [];
      const activeItems = active.data || [];
      const allClients = clients.data || [];
      const totalVal = wonItems.reduce((s: number, i: any) => s + (i.value || 0), 0);
      const avg = wonItems.length ? Math.round(totalVal / wonItems.length) : 0;
      setKpis({
        delivered: wonItems.length,
        active: activeItems.length,
        avgValue: avg,
        repeatPct: 0,
        totalClients: allClients.length,
        repeatClients: 0,
      });
    });

    // Monthly revenue from paid invoices
    supabase
      .from('invoices')
      .select('amount, date, type, status')
      .eq('status', 'Paid')
      .then(({ data }) => {
        const byMonth: number[] = new Array(12).fill(0);
        (data || []).forEach((r: any) => {
          if (!r.date) return;
          const m = new Date(r.date).getMonth();
          byMonth[m] += r.amount || 0;
        });
        const currentMonth = new Date().getMonth();
        setMonthlyRevenue(
          MONTHS.slice(0, currentMonth + 1).map((month, i) => ({ month, value: byMonth[i] }))
        );
      });

    // Revenue by service type from invoices description/category
    supabase
      .from('invoices')
      .select('amount, category, status')
      .eq('status', 'Paid')
      .then(({ data }) => {
        const totals: Record<string, number> = {};
        let grand = 0;
        (data || []).forEach((r: any) => {
          const cat = r.category || 'Other';
          totals[cat] = (totals[cat] || 0) + (r.amount || 0);
          grand += r.amount || 0;
        });
        const breakdown = Object.entries(totals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([label, amount]) => ({
            label,
            amount,
            pct: grand > 0 ? Math.round((amount / grand) * 100) : 0,
          }));
        setServiceBreakdown(breakdown);
      });
  }, []);

  const maxRev = Math.max(...monthlyRevenue.map(d => d.value), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
        <p className="text-text-muted text-sm mt-1">Business overview & analytics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-muted text-xs mb-2">Projects Won</p>
          <p className="text-text-primary text-2xl font-bold">{kpis.delivered}</p>
          <p className="text-accent text-xs mt-1">Total closed deals</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-muted text-xs mb-2">Active Projects</p>
          <p className="text-text-primary text-2xl font-bold">{kpis.active}</p>
          <p className="text-accent text-xs mt-1">In pipeline</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-muted text-xs mb-2">Avg. Project Value</p>
          <p className="text-text-primary text-2xl font-bold">SAR {kpis.avgValue.toLocaleString()}</p>
          <p className="text-accent text-xs mt-1">From won deals</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-muted text-xs mb-2">Total Clients</p>
          <p className="text-text-primary text-2xl font-bold">{kpis.totalClients}</p>
          <p className="text-accent text-xs mt-1">All time</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 size={16} className="text-primary" />
          <h2 className="text-text-primary font-semibold text-sm">Monthly Revenue (SAR)</h2>
        </div>
        {monthlyRevenue.length === 0 ? (
          <p className="text-text-faint text-sm text-center py-8">No revenue data yet</p>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {monthlyRevenue.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-text-faint text-xs tabular-nums">
                  {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
                </span>
                <div
                  className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                  style={{ height: `${(d.value / maxRev) * 100}%`, minHeight: d.value > 0 ? '4px' : '2px' }}
                />
                <span className="text-text-faint text-xs">{d.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service breakdown */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-text-primary font-semibold text-sm mb-4">Revenue by Category</h2>
        {serviceBreakdown.length === 0 ? (
          <p className="text-text-faint text-sm text-center py-8">No categorized invoices yet</p>
        ) : (
          <div className="space-y-3">
            {serviceBreakdown.map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-text-muted text-xs">{item.label}</span>
                  <span className="text-text-primary text-xs font-semibold tabular-nums">
                    SAR {item.amount.toLocaleString()} ({item.pct}%)
                  </span>
                </div>
                <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
