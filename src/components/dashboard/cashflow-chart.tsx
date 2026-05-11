'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { month: 'Jan', income: 12000, expenses: 3500 },
  { month: 'Feb', income: 9500, expenses: 2700 },
  { month: 'Mar', income: 15000, expenses: 3800 },
  { month: 'Apr', income: 11000, expenses: 3100 },
  { month: 'May', income: 18000, expenses: 4500 },
  { month: 'Jun', income: 14500, expenses: 4300 },
];

export function CashFlowChart() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-text-primary font-semibold mb-4">Cash Flow</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="month" tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f1f1f1' }}
            formatter={(value: number) => [`SAR ${value.toLocaleString()}`, '']}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#a0a0a0' }} />
          <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} name="Income" />
          <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
