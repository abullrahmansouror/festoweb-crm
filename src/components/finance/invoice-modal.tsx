'use client';

import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import type { Invoice } from '@/types';

const DB_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue'] as const;

export function InvoiceModal({
  invoice,
  onSave,
  onClose,
}: {
  invoice: Invoice | null;
  onSave: (i: Partial<Invoice> & { id: string }) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      client_name:  invoice?.client_name  || '',
      client_email: invoice?.client_email || '',
      client_phone: invoice?.client_phone || '',
      description:  invoice?.description  || '',
      amount:       invoice?.amount       || 0,
      tax_rate:     invoice?.tax_rate     || 0,
      currency:     invoice?.currency     || 'SAR',
      type:         invoice?.type         || 'income',
      status:       invoice?.status       || 'Draft',
      date:         invoice?.date         || new Date().toISOString().slice(0, 10),
      due_date:     invoice?.due_date     || '',
      note:         invoice?.note         || '',
    },
  });

  const amount   = Number(watch('amount')   || 0);
  const taxRate  = Number(watch('tax_rate') || 0);
  const currency = watch('currency') || 'SAR';
  const taxAmt   = (amount * taxRate) / 100;
  const total    = amount + taxAmt;

  const onSubmit = (data: Partial<Invoice>) =>
    onSave({ ...data, id: invoice?.id || '' } as Partial<Invoice> & { id: string });

  const inputCls =
    'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary';
  const labelCls = 'text-text-muted text-xs mb-1 block';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-text-primary font-semibold">
            {invoice ? 'Edit Invoice' : 'Add Invoice'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface2">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Client Info */}
          <div>
            <label className={labelCls}>Client Name</label>
            <input {...register('client_name')} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Client Email</label>
              <input {...register('client_email')} type="email" placeholder="client@example.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Client Phone</label>
              <input {...register('client_phone')} type="tel" placeholder="+966 5xx xxx xxx" className={inputCls} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <input {...register('description')} className={inputCls} />
          </div>

          {/* Amount + Currency + Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Amount</label>
              <input {...register('amount')} type="number" min="0" step="0.01" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select {...register('currency')} className={inputCls}>
                <option value="SAR">SAR 🇸🇦</option>
                <option value="USD">USD 🇺🇸</option>
                <option value="EUR">EUR 🇪🇺</option>
                <option value="GBP">GBP 🇬🇧</option>
                <option value="AED">AED 🇦🇪</option>
                <option value="MAD">MAD 🇲🇦</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Tax %</label>
            <input {...register('tax_rate')} type="number" min="0" max="100" step="0.1" placeholder="e.g. 15" className={inputCls} />
          </div>

          {/* Tax preview */}
          {taxRate > 0 && (
            <div className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-text-muted space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{currency} {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate}%)</span>
                <span className="tabular-nums">{currency} {taxAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-text-primary border-t border-border pt-1">
                <span>Total</span>
                <span className="tabular-nums">{currency} {total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <select {...register('type')} className={inputCls}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select {...register('status')} className={inputCls}>
                {DB_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date</label>
              <input {...register('date')} type="date" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Due Date (optional)</label>
              <input {...register('due_date')} type="date" className={inputCls} />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className={labelCls}>Note (optional)</label>
            <textarea
              {...register('note')}
              rows={2}
              placeholder="Any additional notes for this invoice..."
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surface2 border border-border text-text-muted hover:text-text-primary px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
