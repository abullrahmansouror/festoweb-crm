import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const invoices = [
  { number: 'INV-024', client: 'Ahmed Al-Rashid', amount: 'SAR 4,500', days: 5 },
  { number: 'INV-023', client: 'Mohammed Salem', amount: 'SAR 3,200', days: 12 },
  { number: 'INV-021', client: 'Sarah Johnson', amount: 'USD 2,800', days: 21 },
  { number: 'INV-019', client: 'Khalid Al-Otaibi', amount: 'SAR 2,300', days: 34 },
];

export function UnpaidInvoices() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold">Unpaid Invoices</h3>
        <FileText size={15} className="text-text-faint" />
      </div>
      <div className="space-y-3">
        {invoices.map((inv) => (
          <div key={inv.number} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-medium">{inv.number}</p>
              <p className="text-text-faint text-xs truncate">{inv.client}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-text-primary text-sm font-medium">{inv.amount}</p>
              <p className={cn(
                'text-xs',
                inv.days > 30 ? 'text-red-400' : inv.days > 14 ? 'text-warning' : 'text-text-faint'
              )}>
                {inv.days}d overdue
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
