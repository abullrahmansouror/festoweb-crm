import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: LucideIcon;
  color: string;
}

export function KPICard({ title, value, change, positive, icon: Icon, color }: KPICardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wide">{title}</p>
        <div className={cn('p-1.5 rounded-lg bg-surface2', color)}>
          <Icon size={14} />
        </div>
      </div>
      <p className="text-xl font-bold text-text-primary">{value}</p>
      <p className={cn('text-xs mt-1', positive ? 'text-accent' : 'text-red-400')}>
        {change}
      </p>
    </div>
  );
}
