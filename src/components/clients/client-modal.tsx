'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/types';
import { X } from 'lucide-react';

const schema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  company_name: z.string().optional(),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect']),
});

type FormData = z.infer<typeof schema>;

export function ClientModal({ client, onClose, onSave }: { client: Client | null; onClose: () => void; onSave: () => void; }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  });

  useEffect(() => {
    if (client) reset({ ...client, website_url: client.website_url || '' });
    else reset({ status: 'active' });
  }, [client, reset]);

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    if (client) {
      await supabase.from('clients').update(data).eq('id', client.id);
    } else {
      await supabase.from('clients').insert(data);
    }
    onSave();
  }

  const field = (label: string, name: keyof FormData, type = 'text', required = false) => (
    <div>
      <label className="text-xs text-text-muted block mb-1">{label}{required && <span className="text-error ml-1">*</span>}</label>
      <input type={type} {...register(name)}
        className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors" />
      {errors[name] && <p className="text-error text-xs mt-1">{errors[name]?.message as string}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">{client ? 'Edit Client' : 'Add Client'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface2 rounded-lg transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('Full Name', 'full_name', 'text', true)}
            {field('Company Name', 'company_name')}
            {field('Email', 'email', 'email', true)}
            {field('Phone', 'phone', 'tel')}
            {field('WhatsApp', 'whatsapp', 'tel')}
            {field('Country', 'country')}
            {field('Industry', 'industry')}
            {field('Website URL', 'website_url', 'url')}
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Status</label>
            <select {...register('status')}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Notes</label>
            <textarea {...register('notes')} rows={3}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-surface2 hover:bg-border text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {isSubmitting ? 'Saving...' : client ? 'Update' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
