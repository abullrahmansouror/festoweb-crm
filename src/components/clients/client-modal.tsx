'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { Client } from '@/types';

const schema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  company_name: z.string().optional(),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  website_url: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect']),
});

type FormData = z.infer<typeof schema>;

interface ClientModalProps {
  client: Client | null;
  onSave: (client: Client) => void;
  onClose: () => void;
}

export function ClientModal({ client, onSave, onClose }: ClientModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: client?.full_name || '',
      company_name: client?.company_name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      whatsapp: client?.whatsapp || '',
      country: client?.country || '',
      industry: client?.industry || '',
      website_url: client?.website_url || '',
      notes: client?.notes || '',
      status: client?.status || 'active',
    },
  });

  const onSubmit = (data: FormData) => {
    onSave({ ...data, id: client?.id || '', created_at: client?.created_at || new Date().toISOString(), updated_at: new Date().toISOString() } as Client);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-text-primary font-semibold">{client ? 'Edit Client' : 'Add Client'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface2 transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Full Name *</label>
              <input {...register('full_name')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Company Name</label>
              <input {...register('company_name')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Email *</label>
            <input {...register('email')} type="email" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Phone</label>
              <input {...register('phone')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">WhatsApp</label>
              <input {...register('whatsapp')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Country</label>
              <input {...register('country')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Industry</label>
              <input {...register('industry')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Website URL</label>
            <input {...register('website_url')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Status</label>
            <select {...register('status')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Notes</label>
            <textarea {...register('notes')} rows={3} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-surface2 border border-border text-text-muted hover:text-text-primary px-4 py-2 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{client ? 'Save Changes' : 'Add Client'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
