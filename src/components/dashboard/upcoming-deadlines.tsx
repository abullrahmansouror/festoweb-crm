import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const deadlines = [
  { project: 'Al-Rashid E-commerce', client: 'Ahmed Al-Rashid', days: 2, urgent: true },
  { project: 'Salem Stores Redesign', client: 'Mohammed Salem', days: 5, urgent: true },
  { project: 'TechVision Landing', client: 'Sarah Johnson', days: 10, urgent: false },
  { project: 'Otaibi Website', client: 'Khalid Al-Otaibi', days: 18, urgent: false },
];

export function UpcomingDeadlines() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold">Upcoming Deadlines</h3>
        <Clock size={15} className="text-text-faint" />
      </div>
      <div className="space-y-3">
        {deadlines.map((d) => (
          <div key={d.project} className="flex items-center gap-3">
            <div className={cn(
              'w-2 h-2 rounded-full shrink-0',
              d.urgent ? 'bg-red-400' : 'bg-accent'
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-medium truncate">{d.project}</p>
              <p className="text-text-faint text-xs">{d.client}</p>
            </div>
            <span className={cn(
              'text-xs font-medium shrink-0',
              d.urgent ? 'text-red-400' : 'text-text-muted'
            )}>
              {d.days}d
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
