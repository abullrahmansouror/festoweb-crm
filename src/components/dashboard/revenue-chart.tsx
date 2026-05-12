'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function RevenueChart() {
  const [data, setData] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('invoices')
      .select('amount, type, status, date')
      .eq('status', 'Paid')
      .then(({ data: rows }) => {
        const byMonth: Record<number, { revenue: number; expenses: number }> = {};
        for (let i = 0; i < 12; i++) byMonth[i] = { revenue: 0, expenses: 0 };
        (rows || []).forEach(r => {
          if (!r.date) return;
          const m = new Date(r.date).getMonth();
          if (r.type === 'income') byMonth[m].revenue += r.amount || 0;
          else byMonth[m].expenses += r.amount || 0;
        });
        setData(MONTHS.map((name, i) => ({
          name,
          Revenue: byMonth[i].revenue,
          Profit: Math.max(0, byMonth[i].revenue - byMonth[i].expenses),
        })));
      });
  }, []);

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-text-primary font-semibold mb-4">Revenue &amp; Profit</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#1c1b19', border: '1px solid #333', borderRadius: 8, color: '#cdccca' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
          <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="url(#gRev)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="Profit" stroke="#0d9488" fill="url(#gProfit)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
