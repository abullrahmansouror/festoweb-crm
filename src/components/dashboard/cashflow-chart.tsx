'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function CashFlowChart() {
  const [data, setData] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('invoices')
      .select('amount, type, status, date')
      .then(({ data: rows }) => {
        const byMonth: Record<number, { income: number; expenses: number }> = {};
        for (let i = 0; i < 12; i++) byMonth[i] = { income: 0, expenses: 0 };
        (rows || []).forEach(r => {
          if (!r.date) return;
          const m = new Date(r.date).getMonth();
          if (r.type === 'income' && r.status === 'Paid') byMonth[m].income += r.amount || 0;
          else if (r.type === 'expense') byMonth[m].expenses += r.amount || 0;
        });
        // Only show months that have data or up to current month
        const currentMonth = new Date().getMonth();
        setData(MONTHS.slice(0, currentMonth + 1).map((name, i) => ({
          name,
          Income: byMonth[i].income,
          Expenses: byMonth[i].expenses,
        })));
      });
  }, []);

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-text-primary font-semibold mb-4">Cash Flow</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#1c1b19', border: '1px solid #333', borderRadius: 8, color: '#cdccca' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
          <Bar dataKey="Income" fill="#6366f1" radius={[4,4,0,0]} />
          <Bar dataKey="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
