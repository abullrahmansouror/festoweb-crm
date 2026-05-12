'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { PipelineCard, PipelineStage, ServiceType } from '@/types';

const schema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  company_name: z.string().optional(),
  service_type: z.enum(['website_design','website_redesign','landing_page','maintenance','ecommerce']),
  value: z.coerce.number().optional(),
  stage: z.enum(['lead','discovery_call','deal_in_meeting','paid_deposit','in_progress','review','completed_paid']),
  notes: z.string().optional(),
  next_follow_up: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PipelineCardModalProps {
  card: PipelineCard | null;
  onSave: (card: PipelineCard) => void;
  onClose: () => void;
}

export function PipelineCardModal({ card, onSave, onClose }: PipelineCardModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_name: card?.client_name || '',
      company_name: card?.company_name || '',
      service_type: card?.service_type || 'website_design',
      value: card?.value || undefined,
      stage: card?.stage || 'lead',
      notes: card?.notes || '',
      next_follow_up: card?.next_follow_up ? new Date(card.next_follow_up).toISOString().slice(0,16) : '',
    },
  });

  const onSubmit = (data: FormData) => {
    onSave({ ...data, id: card?.id || '', service_type: data.service_type as ServiceType, stage: data.stage as PipelineStage, created_at: card?.created_at || new Date().toISOString(), updated_at: new Date().toISOString() } as PipelineCard);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-text-primary font-semibold">{card ? 'Edit Deal' : 'Add Deal'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface2"><X size={18} className="text-text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Client Name *</label>
              <input {...register('client_name')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
              {errors.client_name && <p className="text-red-400 text-xs mt-1">{errors.client_name.message}</p>}
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Company</label>
              <input {...register('company_name')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-xs mb-1 block">Service</label>
              <select {...register('service_type')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
                <option value="website_design">Web Design</option>
                <option value="website_redesign">Redesign</option>
                <option value="landing_page">Landing Page</option>
                <option value="maintenance">Maintenance</option>
                <option value="ecommerce">E-commerce</option>
              </select>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1 block">Value (SAR)</label>
              <input {...register('value')} type="number" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Stage</label>
            <select {...register('stage')} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="lead">Lead</option>
              <option value="discovery_call">Discovery Call</option>
              <option value="deal_in_meeting">Deal in Meeting</option>
              <option value="paid_deposit">Paid Deposit 50%</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed_paid">Completed Paid</option>
            </select>
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Next Follow-up</label>
            <input {...register('next_follow_up')} type="datetime-local" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Notes</label>
            <textarea {...register('notes')} rows={3} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-surface2 border border-border text-text-muted hover:text-text-primary px-4 py-2 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{card ? 'Save Changes' : 'Add Deal'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
