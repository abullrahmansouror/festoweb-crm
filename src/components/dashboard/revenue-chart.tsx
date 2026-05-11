'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { month: 'Jan', revenue: 12000, profit: 8500, expenses: 3500 },
  { month: 'Feb', revenue: 9500, profit: 6800, expenses: 2700 },
  { month: 'Mar', revenue: 15000, profit: 11200, expenses: 3800 },
  { month: 'Apr', revenue: 11000, profit: 7900, expenses: 3100 },
  { month: 'May', revenue: 18000, profit: 13500, expenses: 4500 },
  { month: 'Jun', revenue: 14500, profit: 10200, expenses: 4300 },
  { month: 'Jul', revenue: 16000, profit: 11800, expenses: 4200 },
  { month: 'Aug', revenue: 13000, profit: 9500, expenses: 3500 },
  { month: 'Sep', revenue: 19500, profit: 14800, expenses: 4700 },
  { month: 'Oct', revenue: 17000, profit: 12500, expenses: 4500 },
  { month: 'Nov', revenue: 21000, profit: 16000, expenses: 5000 },
  { month: 'Dec', revenue: 22000, profit: 17200, expenses: 4800 },
];

export function RevenueChart() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-text-primary font-semibold mb-4">Revenue & Profit</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="month" tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#a0a0a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f1f1f1' }}
            formatter={(value: number) => [`SAR ${value.toLocaleString()}`, '']}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#a0a0a0' }} />
          <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" />
          <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#colorProfit)" name="Profit" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
