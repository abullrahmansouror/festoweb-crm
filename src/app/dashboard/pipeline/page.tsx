'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PipelineCard, PipelineStage } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Plus, MoreHorizontal } from 'lucide-react';

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: 'border-gray-500' },
  { id: 'discovery_call', label: 'Discovery Call', color: 'border-blue-500' },
  { id: 'deal_in_meeting', label: 'Deal in Meeting', color: 'border-yellow-500' },
  { id: 'paid_deposit', label: 'Paid Deposit 50%', color: 'border-orange-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-primary' },
  { id: 'review', label: 'Review', color: 'border-purple-500' },
  { id: 'completed_paid', label: 'Completed Paid', color: 'border-accent' },
];

const SERVICE_LABELS: Record<string, string> = {
  website_design: 'Website Design',
  website_redesign: 'Redesign',
  landing_page: 'Landing Page',
  maintenance: 'Maintenance',
  ecommerce: 'E-commerce',
};

export default function PipelinePage() {
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newCard, setNewCard] = useState({ client_name: '', service_type: 'website_design', value: '', stage: 'lead' as PipelineStage, notes: '' });

  async function fetchCards() {
    const supabase = createClient();
    const { data } = await supabase.from('pipeline_leads').select('*').order('created_at', { ascending: false });
    setCards(data || []);
  }

  useEffect(() => { fetchCards(); }, []);

  async function addCard() {
    if (!newCard.client_name) return;
    const supabase = createClient();
    await supabase.from('pipeline_leads').insert({
      ...newCard,
      value: newCard.value ? Number(newCard.value) : null,
    });
    setShowForm(false);
    setNewCard({ client_name: '', service_type: 'website_design', value: '', stage: 'lead', notes: '' });
    fetchCards();
  }

  async function moveCard(cardId: string, newStage: PipelineStage) {
    const supabase = createClient();
    await supabase.from('pipeline_leads').update({ stage: newStage }).eq('id', cardId);
    fetchCards();
  }

  async function deleteCard(id: string) {
    const supabase = createClient();
    await supabase.from('pipeline_leads').delete().eq('id', id);
    fetchCards();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sales Pipeline</h1>
          <p className="text-text-muted text-sm">{cards.length} leads total</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-text-primary font-semibold mb-4">New Lead</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Client Name *" value={newCard.client_name}
              onChange={e => setNewCard({ ...newCard, client_name: e.target.value })}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            <input placeholder="Deal Value (SAR)" value={newCard.value}
              onChange={e => setNewCard({ ...newCard, value: e.target.value })}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            <select value={newCard.service_type} onChange={e => setNewCard({ ...newCard, service_type: e.target.value })}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              {Object.entries(SERVICE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={newCard.stage} onChange={e => setNewCard({ ...newCard, stage: e.target.value as PipelineStage })}
              className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <textarea placeholder="Notes" value={newCard.notes}
              onChange={e => setNewCard({ ...newCard, notes: e.target.value })}
              className="col-span-2 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none" rows={2} />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-surface2 hover:bg-border text-text-primary rounded-lg text-sm transition-colors">Cancel</button>
            <button onClick={addCard}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors">Add Lead</button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageCards = cards.filter(c => c.stage === stage.id);
          return (
            <div key={stage.id}
              className={`shrink-0 w-64 bg-surface border-t-2 ${stage.color} border-x border-b border-border rounded-xl`}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragging) moveCard(dragging, stage.id); setDragging(null); }}>
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-text-primary text-sm font-semibold">{stage.label}</span>
                  <span className="bg-surface2 text-text-muted text-xs px-2 py-0.5 rounded-full">{stageCards.length}</span>
                </div>
                {stageCards.length > 0 && (
                  <p className="text-text-faint text-xs mt-1">
                    {formatCurrency(stageCards.reduce((s, c) => s + (c.value || 0), 0))}
                  </p>
                )}
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {stageCards.map(card => (
                  <div key={card.id} draggable
                    onDragStart={() => setDragging(card.id)}
                    className="bg-surface2 border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-text-primary text-sm font-medium leading-snug">{card.client_name}</p>
                      <button onClick={() => deleteCard(card.id)} className="text-text-faint hover:text-error transition-colors shrink-0">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                    <p className="text-text-faint text-xs mt-1">{SERVICE_LABELS[card.service_type]}</p>
                    {card.value && <p className="text-accent text-xs font-semibold mt-2">{formatCurrency(card.value)}</p>}
                    {card.notes && <p className="text-text-muted text-xs mt-2 line-clamp-2">{card.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
