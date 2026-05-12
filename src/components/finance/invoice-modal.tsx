'use client';

import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import type { Invoice } from '@/types';

// Must match DB check constraint: 'Draft','Sent','Paid','Overdue'
const DB_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue'] as const;

export function InvoiceModal({ invoice, onSave, onClose }: { invoice: Invoice | null; onSave: (i: Invoice) => void; onClose: () => void }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      client_name: invoice?.client_name || '',
      description: invoice?.description || '',
      amount: invoice?.amount || 0,
      type: invoice?.type || 'income',
      status: (invoice?.status as any) || 'Draft',
      date: invoice?.date || new Date().toISOString().slice(0,10),
      due_date: invoice?.due_date || '',
    },
  });

  const onSubmit = (data: any) => onSave({ ...data, id: invoice?.id || '' } as Invoice);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-text-primary font-semibold">{invoice ? 'Edit Invoice' : 'Add Invoice'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface2"><X size={18} className="text-text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="text-text-muted text-xs mb-1 block">Client Name</label>
            <input {...register('client_name')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Description</label>
            <input {...register('description')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Amount (SAR)</label>
              <input {...register('amount')} type="number" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Type</label>
              <select {...register('type')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Status</label>
              <select {...register('status')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
                {DB_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Date</label>
              <input {...register('date')} type="date" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Due Date (optional)</label>
            <input {...register('due_date')} type="date" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-surface2 border border-border text-text-muted hover:text-text-primary px-4 py-2 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
