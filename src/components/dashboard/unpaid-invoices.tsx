'use client';
import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function UnpaidInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('invoices')
      .select('id, invoice_number, client_name, amount, status, due_date')
      .in('status', ['Sent', 'Overdue'])
      .order('due_date', { ascending: true })
      .limit(5)
      .then(({ data }) => setInvoices(data || []));
  }, []);

  const daysOverdue = (due: string) => {
    if (!due) return null;
    const diff = Math.floor((Date.now() - new Date(due).getTime()) / 86400000);
    return diff > 0 ? diff : null;
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-primary font-semibold">Unpaid Invoices</p>
        <FileText size={16} className="text-text-faint" />
      </div>
      {invoices.length === 0 ? (
        <p className="text-text-faint text-sm text-center py-8">No unpaid invoices 🎉</p>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const overdue = daysOverdue(inv.due_date);
            return (
              <div key={inv.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-text-primary text-sm font-medium">{inv.invoice_number || 'INV'}</p>
                  <p className="text-text-faint text-xs truncate">{inv.client_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-text-primary text-sm font-semibold">SAR {(inv.amount||0).toLocaleString()}</p>
                  {overdue ? (
                    <p className="text-red-400 text-xs">{overdue}d overdue</p>
                  ) : (
                    <p className="text-blue-400 text-xs">{inv.status}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
