'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Plus, Trash2 } from 'lucide-react';

export function InvoiceModal({ invoice, onClose, onSave }: { invoice: any; onClose: () => void; onSave: () => void; }) {
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({
    client_id: '', currency: 'SAR', tax_rate: 15, status: 'draft',
    due_date: '', notes: '', thank_you_message: 'Thank you for your business!',
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createClient().from('clients').select('id, full_name').then(({ data }) => setClients(data || []));
    if (invoice) {
      setForm({ client_id: invoice.client_id || '', currency: invoice.currency, tax_rate: invoice.tax_rate,
        status: invoice.status, due_date: invoice.due_date || '', notes: invoice.notes || '',
        thank_you_message: invoice.thank_you_message || 'Thank you for your business!' });
      setItems(invoice.invoice_items?.length ? invoice.invoice_items : [{ description: '', quantity: 1, unit_price: 0 }]);
    }
  }, [invoice]);

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
  const taxAmount = (subtotal * form.tax_rate) / 100;
  const total = subtotal + taxAmount;

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const invoiceData = { ...form, subtotal, tax_amount: taxAmount, total };
    if (invoice) {
      await supabase.from('invoices').update(invoiceData).eq('id', invoice.id);
      await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
      await supabase.from('invoice_items').insert(items.map(i => ({ ...i, invoice_id: invoice.id, total: i.quantity * i.unit_price })));
    } else {
      const num = `FW-${Date.now().toString().slice(-6)}`;
      const { data: inv } = await supabase.from('invoices').insert({ ...invoiceData, invoice_number: num }).select().single();
      if (inv) await supabase.from('invoice_items').insert(items.map(i => ({ ...i, invoice_id: inv.id, total: i.quantity * i.unit_price })));
    }
    setSaving(false);
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">{invoice ? 'Edit Invoice' : 'New Invoice'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface2 rounded-lg"><X size={18} className="text-text-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="">Select Client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="AED">AED</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted whitespace-nowrap">VAT %</label>
              <input type="number" value={form.tax_rate} onChange={e => setForm({...form, tax_rate: Number(e.target.value)})}
                className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
              placeholder="Due Date"
              className="col-span-2 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-text-muted font-medium">Line Items</label>
              <button onClick={() => setItems([...items, { description: '', quantity: 1, unit_price: 0 }])}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover">
                <Plus size={13} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input placeholder="Description" value={item.description}
                    onChange={e => { const arr = [...items]; arr[i].description = e.target.value; setItems(arr); }}
                    className="col-span-6 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="Qty" value={item.quantity}
                    onChange={e => { const arr = [...items]; arr[i].quantity = Number(e.target.value); setItems(arr); }}
                    className="col-span-2 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="Price" value={item.unit_price}
                    onChange={e => { const arr = [...items]; arr[i].unit_price = Number(e.target.value); setItems(arr); }}
                    className="col-span-3 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="col-span-1 flex items-center justify-center text-text-faint hover:text-error">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-surface2 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal</span><span>{form.currency} {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>VAT ({form.tax_rate}%)</span><span>{form.currency} {taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-text-primary font-bold pt-1 border-t border-border">
              <span>Total</span><span className="text-primary">{form.currency} {total.toLocaleString()}</span>
            </div>
          </div>

          <textarea value={form.thank_you_message} onChange={e => setForm({...form, thank_you_message: e.target.value})}
            placeholder="Thank you message" rows={2}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none" />

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 bg-surface2 text-text-primary px-4 py-2 rounded-lg text-sm">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving...' : invoice ? 'Update' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
