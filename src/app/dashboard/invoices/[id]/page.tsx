'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateInvoicePDF } from '@/lib/pdf';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, ArrowLeft, Pencil } from 'lucide-react';
import { InvoiceModal } from '@/components/invoices/invoice-modal';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400',
  sent: 'bg-blue-500/10 text-blue-400',
  paid: 'bg-accent/10 text-accent',
  overdue: 'bg-error/10 text-error',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  async function fetchInvoice() {
    const supabase = createClient();
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(*), invoice_items(*)')
      .eq('id', id)
      .single();
    setInvoice(data);
    setLoading(false);
  }

  useEffect(() => { fetchInvoice(); }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-text-muted">Loading invoice...</p>
    </div>
  );

  if (!invoice) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-text-muted">Invoice not found.</p>
    </div>
  );

  const subtotal   = Number(invoice.subtotal || 0);
  const taxAmount  = Number(invoice.tax_amount || 0);
  const total      = Number(invoice.total || 0);
  const items      = invoice.invoice_items || [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 bg-surface border border-border hover:bg-surface2 text-text-primary px-4 py-2 rounded-lg text-sm transition-colors">
            <Pencil size={14} /> Edit
          </button>
          <button onClick={() => generateInvoicePDF(invoice)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">INVOICE</h1>
              <p className="text-text-muted text-sm mt-1">#{invoice.invoice_number}</p>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${STATUS_COLORS[invoice.status] || 'bg-gray-500/10 text-gray-400'}`}>
              {invoice.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Issued to + Dates */}
        <div className="grid grid-cols-2 gap-6 p-6 border-b border-border">
          <div>
            <p className="text-xs text-text-faint uppercase tracking-wider mb-2">Issued To</p>
            <p className="text-text-primary font-semibold">{invoice.clients?.full_name || '-'}</p>
            {invoice.clients?.company_name && <p className="text-text-muted text-sm">{invoice.clients.company_name}</p>}
            {invoice.clients?.phone      && <p className="text-text-muted text-sm">{invoice.clients.phone}</p>}
            {invoice.clients?.email      && <p className="text-text-muted text-sm">{invoice.clients.email}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-faint">Issue Date</span>
              <span className="text-text-primary">{formatDate(invoice.created_at)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-faint">Due Date</span>
              <span className="text-text-primary">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-faint">Currency</span>
              <span className="text-text-primary">{invoice.currency}</span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="p-6 border-b border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                  <th key={h} className={`text-xs text-text-faint font-medium pb-3 ${
                    h === 'Description' ? 'text-left' : 'text-right'
                  }`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-text-faint text-sm">No items</td></tr>
              ) : items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3 text-sm text-text-primary">{item.description || '-'}</td>
                  <td className="py-3 text-sm text-text-muted text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-text-muted text-right">
                    {formatCurrency(item.unit_price, invoice.currency)}
                  </td>
                  <td className="py-3 text-sm text-text-primary font-medium text-right">
                    {formatCurrency(item.total ?? item.unit_price * item.quantity, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 border-b border-border">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-text-primary">{formatCurrency(subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Tax ({invoice.tax_rate}%)</span>
              <span className="text-text-primary">{formatCurrency(taxAmount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
              <span className="text-text-primary">Total</span>
              <span className="text-primary text-base">{formatCurrency(total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Thank you */}
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-faint uppercase tracking-wider mb-1">Payment To</p>
            <p className="text-text-primary font-semibold text-sm">FestoWeb</p>
          </div>
          <p className="text-text-muted text-sm italic">
            {invoice.thank_you_message || 'Thank you for your business!'}
          </p>
        </div>
      </div>

      {showEdit && (
        <InvoiceModal
          invoice={invoice}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); fetchInvoice(); }}
        />
      )}
    </div>
  );
}
