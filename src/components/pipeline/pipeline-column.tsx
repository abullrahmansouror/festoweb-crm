'use client';

import { PipelineCardItem } from './pipeline-card-item';
import type { PipelineCard, PipelineStage } from '@/types';
import { cn } from '@/lib/utils';

interface PipelineColumnProps {
  stage: { id: PipelineStage; label: string; color: string };
  cards: PipelineCard[];
  onDragStart: (id: string) => void;
  onDrop: (stage: PipelineStage) => void;
  onEdit: (card: PipelineCard) => void;
  onDelete: (id: string) => void;
}

export function PipelineColumn({ stage, cards, onDragStart, onDrop, onEdit, onDelete }: PipelineColumnProps) {
  const total = cards.reduce((sum, c) => sum + (c.value || 0), 0);

  return (
    <div
      className={cn('bg-surface border border-border rounded-xl flex flex-col min-w-[220px] w-[220px] border-t-2', stage.color)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(stage.id)}
    >
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <p className="text-text-primary text-xs font-semibold">{stage.label}</p>
          <span className="bg-surface2 text-text-muted text-xs px-1.5 py-0.5 rounded-full">{cards.length}</span>
        </div>
        {total > 0 && <p className="text-text-faint text-xs mt-0.5">SAR {total.toLocaleString()}</p>}
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {cards.map((card) => (
          <PipelineCardItem
            key={card.id}
            card={card}
            onDragStart={onDragStart}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {cards.length === 0 && (
          <div className="text-center py-6">
            <p className="text-text-faint text-xs">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}
