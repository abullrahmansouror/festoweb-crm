'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { PipelineColumn } from '@/components/pipeline/pipeline-column';
import { PipelineCardModal } from '@/components/pipeline/pipeline-card-modal';
import { createClient } from '@/lib/supabase/client';
import type { PipelineCard, PipelineStage } from '@/types';

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: 'border-t-purple-400' },
  { id: 'discovery_call', label: 'Discovery Call', color: 'border-t-blue-400' },
  { id: 'deal_in_meeting', label: 'Deal in Meeting', color: 'border-t-yellow-400' },
  { id: 'paid_deposit', label: 'Paid Deposit 50%', color: 'border-t-orange-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-t-primary' },
  { id: 'review', label: 'Review', color: 'border-t-cyan-400' },
  { id: 'completed_paid', label: 'Completed Paid', color: 'border-t-accent' },
];

export default function PipelinePage() {
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
      .from('pipeline_leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else if (data) setCards(data.map((d: any) => ({
      id: d.id,
      client_name: d.client_name,
      company_name: d.company,
      service_type: d.service,
      value: d.value,
      stage: d.stage,
      notes: d.notes,
      next_follow_up: d.follow_up_date,
      created_at: d.created_at,
      updated_at: d.updated_at,
    })) as PipelineCard[]);
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, []);

  const totalValue = cards.reduce((sum, c) => sum + (c.value || 0), 0);

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDrop = async (stage: PipelineStage) => {
    if (!draggingId) return;
    await supabase.from('pipeline_leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', draggingId);
    setDraggingId(null);
    fetchCards();
  };

  const handleSave = async (card: PipelineCard) => {
    const payload = {
      client_name: card.client_name,
      company: card.company_name,
      service: card.service_type,
      value: card.value,
      stage: card.stage,
      notes: card.notes,
      follow_up_date: card.next_follow_up || null,
      updated_at: new Date().toISOString(),
    };
    if (editingCard) {
      const { error: err } = await supabase.from('pipeline_leads').update(payload).eq('id', card.id);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from('pipeline_leads').insert([{ ...payload, created_at: new Date().toISOString() }]);
      if (err) { setError(err.message); return; }
    }
    setShowModal(false);
    setEditingCard(null);
    fetchCards();
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
          <p className="text-text-muted text-sm mt-1">{cards.length} deals · Total value: SAR {totalValue.toLocaleString()}</p>
        </div>
        <button
          onClick={() => { setEditingCard(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Deal
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          ⚠️ Error: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16"><p className="text-text-muted">Loading pipeline...</p></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              cards={cards.filter((c) => c.stage === stage.id)}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onEdit={(card) => { setEditingCard(card); setShowModal(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <PipelineCardModal
          card={editingCard}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingCard(null); }}
        />
      )}
    </div>
  );
}
