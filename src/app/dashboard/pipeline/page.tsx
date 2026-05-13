'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { PipelineColumn } from '@/components/pipeline/pipeline-column';
import { PipelineCardModal } from '@/components/pipeline/pipeline-card-modal';
import { createClient } from '@/lib/supabase/client';
import { useCurrency } from '@/lib/currency-context';
import type { PipelineCard } from '@/types';

const STAGES: { id: string; label: string; color: string }[] = [
  { id: 'Lead',              label: 'Lead',              color: 'border-t-purple-400' },
  { id: 'Discovery Call',   label: 'Discovery Call',    color: 'border-t-blue-400' },
  { id: 'Deal in Meeting',  label: 'Deal in Meeting',   color: 'border-t-yellow-400' },
  { id: 'Paid Deposit 50%', label: 'Paid Deposit 50%',  color: 'border-t-orange-400' },
  { id: 'In Progress',      label: 'In Progress',       color: 'border-t-primary' },
  { id: 'Review',           label: 'Review',            color: 'border-t-cyan-400' },
  { id: 'Completed Paid 50%', label: 'Completed Paid 50%', color: 'border-t-accent' },
];

export default function PipelinePage() {
  const { fmt, convert, currency } = useCurrency();
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<PipelineCard | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCards = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('pipeline_leads').select('*').order('created_at', { ascending: false });
    if (err) setError(err.message);
    else if (data) setCards(data.map((d: any) => ({
      id: d.id,
      client_name:    d.client_name,
      client_email:   d.client_email || d.email || '',
      company_name:   d.company,
      service_type:   d.service,
      value:          d.value,
      currency:       d.currency || 'SAR',
      stage:          d.stage,
      notes:          d.notes,
      next_follow_up: d.follow_up_date,
      created_at:     d.created_at,
      updated_at:     d.updated_at,
    })) as PipelineCard[]);
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, []);

  // Total re-computed on currency change — no refetch
  const totalValue = useMemo(() =>
    cards.reduce((sum, c) => sum + convert(c.value || 0, (c as any).currency || 'SAR'), 0),
    [cards, convert, currency]
  );

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDrop = async (stage: string) => {
    if (!draggingId) return;
    await supabase.from('pipeline_leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', draggingId);
    setDraggingId(null); fetchCards();
  };

  const handleSave = async (card: any) => {
    const payload = {
      client_name:   card.client_name,
      client_email:  card.client_email || null,
      company:       card.company_name,
      service:       card.service_type,
      value:         card.value,
      currency:      card.currency || 'SAR',
      stage:         card.stage,
      notes:         card.notes,
      follow_up_date: card.next_follow_up || null,
      updated_at:    new Date().toISOString(),
    };
    if (editingCard) {
      const { error: err } = await supabase.from('pipeline_leads').update(payload).eq('id', card.id);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from('pipeline_leads')
        .insert([{ ...payload, created_at: new Date().toISOString() }]);
      if (err) { setError(err.message); return; }
    }
    setError(null); setShowModal(false); setEditingCard(null); fetchCards();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('pipeline_leads').delete().eq('id', id);
    fetchCards();
  };

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sales Pipeline</h1>
          <p className="text-text-muted text-sm mt-1">
            {cards.length} deals · Total value: {fmt(totalValue)}
          </p>
        </div>
        <button onClick={() => { setEditingCard(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Deal
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">⚠️ {error}</div>}

      {loading ? (
        <div className="text-center py-16"><p className="text-text-muted">Loading pipeline...</p></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage as any}
              cards={cards.filter((c) => c.stage === stage.id)}
              onDragStart={handleDragStart}
              onDrop={handleDrop as any}
              onEdit={(card) => { setEditingCard(card); setShowModal(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <PipelineCardModal card={editingCard} stages={STAGES.map(s => s.id)}
          onSave={handleSave as any}
          onClose={() => { setShowModal(false); setEditingCard(null); }} />
      )}
    </div>
  );
}
