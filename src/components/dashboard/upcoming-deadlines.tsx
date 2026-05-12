'use client';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function UpcomingDeadlines() {
  const [items, setItems] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('pipeline_items')
      .select('id, title, client_name, expected_close_date, status')
      .not('expected_close_date', 'is', null)
      .not('status', 'in', '("won","lost")')
      .gte('expected_close_date', today)
      .order('expected_close_date', { ascending: true })
      .limit(5)
      .then(({ data }) => setItems(data || []));
  }, []);

  const daysLeft = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    return diff;
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-primary font-semibold">Upcoming Deadlines</p>
        <Clock size={16} className="text-text-faint" />
      </div>
      {items.length === 0 ? (
        <p className="text-text-faint text-sm text-center py-8">No upcoming deadlines</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const days = daysLeft(item.expected_close_date);
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${days <= 3 ? 'bg-red-400' : days <= 7 ? 'bg-yellow-400' : 'bg-accent'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium truncate">{item.title}</p>
                  <p className="text-text-faint text-xs">{item.client_name || '—'}</p>
                </div>
                <span className={`text-xs font-semibold shrink-0 ${
                  days <= 3 ? 'text-red-400' : days <= 7 ? 'text-yellow-400' : 'text-text-muted'
                }`}>{days}d</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
