'use client';

import { GripVertical, Edit, Trash2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useCurrency } from '@/lib/currency-context';
import type { PipelineCard } from '@/types';

const serviceLabels: Record<string, string> = {
  website_design: 'Web Design', website_redesign: 'Redesign',
  landing_page: 'Landing Page', maintenance: 'Maintenance', ecommerce: 'E-commerce',
};

interface Props {
  card: PipelineCard;
  onDragStart: (id: string) => void;
  onEdit: (card: PipelineCard) => void;
  onDelete: (id: string) => void;
}

export function PipelineCardItem({ card, onDragStart, onEdit, onDelete }: Props) {
  const { fmt, convert } = useCurrency();
  const cardCurrency = (card as any).currency || 'SAR';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(card.id)}
      className="bg-surface2 border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <GripVertical size={12} className="text-text-faint shrink-0" />
          <p className="text-text-primary text-xs font-semibold leading-tight">{card.client_name}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(card)} className="p-0.5 hover:text-primary text-text-faint transition-colors"><Edit size={11} /></button>
          <button onClick={() => onDelete(card.id)} className="p-0.5 hover:text-red-400 text-text-faint transition-colors"><Trash2 size={11} /></button>
        </div>
      </div>
      {card.company_name && <p className="text-text-faint text-xs ml-4 mb-1">{card.company_name}</p>}
      <div className="ml-4 space-y-1">
        {card.service_type && (
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{serviceLabels[card.service_type] ?? card.service_type}</span>
        )}
        {card.value != null && (
          <p className="text-accent text-xs font-medium">{fmt(convert(card.value, cardCurrency))}</p>
        )}
        {card.next_follow_up && (
          <div className="flex items-center gap-1 text-text-faint text-xs">
            <Calendar size={10} />{formatDate(card.next_follow_up)}
          </div>
        )}
      </div>
    </div>
  );
}
