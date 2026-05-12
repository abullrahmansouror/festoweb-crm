'use client';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function RecentClients() {
  const [clients, setClients] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, full_name, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (!error) setClients(data || []);
      });
  }, []);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return '1 day ago';
    if (d < 7) return `${d} days ago`;
    if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(d / 30)} month${Math.floor(d / 30) > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-primary font-semibold">Recent Clients</p>
        <Users size={16} className="text-text-faint" />
      </div>
      {clients.length === 0 ? (
        <p className="text-text-faint text-sm text-center py-8">No clients yet</p>
      ) : (
        <div className="space-y-3">
          {clients.map(c => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {c.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">{c.full_name}</p>
                <p className="text-text-faint text-xs truncate">{c.company_name || '—'}</p>
              </div>
              <span className="text-text-faint text-xs shrink-0">{timeAgo(c.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
