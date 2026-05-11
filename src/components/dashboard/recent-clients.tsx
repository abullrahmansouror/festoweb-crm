import { Users } from 'lucide-react';

const clients = [
  { name: 'Ahmed Al-Rashid', company: 'Al-Rashid Group', country: 'SA', date: '2 days ago' },
  { name: 'Mohammed Salem', company: 'Salem Stores', country: 'SA', date: '5 days ago' },
  { name: 'Sarah Johnson', company: 'TechVision Ltd', country: 'US', date: '1 week ago' },
  { name: 'Khalid Al-Otaibi', company: 'Otaibi Real Estate', country: 'SA', date: '2 weeks ago' },
];

export function RecentClients() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold">Recent Clients</h3>
        <Users size={15} className="text-text-faint" />
      </div>
      <div className="space-y-3">
        {clients.map((client) => (
          <div key={client.name} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-bold">{client.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-medium truncate">{client.name}</p>
              <p className="text-text-faint text-xs truncate">{client.company}</p>
            </div>
            <span className="text-text-faint text-xs shrink-0">{client.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
