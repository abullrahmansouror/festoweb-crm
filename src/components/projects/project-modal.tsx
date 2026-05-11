'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1),
  client_id: z.string().optional(),
  service_type: z.enum(['website_design','website_redesign','landing_page','maintenance','ecommerce']),
  status: z.enum(['pending','in_progress','waiting_review','completed']),
  deadline: z.string().optional(),
  budget: z.number().optional(),
  cost: z.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ProjectModal({ project, onClose, onSave }: { project: any; onClose: () => void; onSave: () => void; }) {
  const [clients, setClients] = useState<any[]>([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { service_type: 'website_design', status: 'pending' },
  });

  useEffect(() => {
    createClient().from('clients').select('id, full_name').then(({ data }) => setClients(data || []));
    if (project) reset({ ...project, budget: Number(project.budget), cost: Number(project.cost) });
    else reset({ service_type: 'website_design', status: 'pending' });
  }, [project, reset]);

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    if (project) await supabase.from('projects').update(data).eq('id', project.id);
    else await supabase.from('projects').insert(data);
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface2 rounded-lg"><X size={18} className="text-text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <input {...register('name')} placeholder="Project Name *"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          <select {...register('client_id')}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
            <option value="">Select Client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select {...register('service_type')}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="website_design">Website Design</option>
              <option value="website_redesign">Redesign</option>
              <option value="landing_page">Landing Page</option>
              <option value="maintenance">Maintenance</option>
              <option value="ecommerce">E-commerce</option>
            </select>
            <select {...register('status')}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_review">Waiting Review</option>
              <option value="completed">Completed</option>
            </select>
            <input type="number" {...register('budget', { valueAsNumber: true })} placeholder="Budget (SAR)"
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            <input type="number" {...register('cost', { valueAsNumber: true })} placeholder="Cost (SAR)"
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            <input type="date" {...register('deadline')}
              className="col-span-2 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
          <textarea {...register('notes')} rows={2} placeholder="Notes"
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 bg-surface2 text-text-primary px-4 py-2 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
              {isSubmitting ? 'Saving...' : project ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
