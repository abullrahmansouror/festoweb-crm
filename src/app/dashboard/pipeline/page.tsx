'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PipelineColumn } from '@/components/pipeline/pipeline-column';
import { PipelineCardModal } from '@/components/pipeline/pipeline-card-modal';
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

const initialCards: PipelineCard[] = [
  { id: '1', client_name: 'Faisal Al-Dosari', company_name: 'Dosari Pharma', service_type: 'website_design', value: 8000, stage: 'lead', notes: 'Interested in full website redesign', next_follow_up: '2024-04-10T10:00:00Z', created_at: '2024-04-01', updated_at: '2024-04-01' },
  { id: '2', client_name: 'Nora Al-Qahtani', company_name: 'Nora Fashion', service_type: 'ecommerce', value: 15000, stage: 'discovery_call', notes: 'Wants full e-commerce store', next_follow_up: '2024-04-08T14:00:00Z', created_at: '2024-04-02', updated_at: '2024-04-02' },
  { id: '3', client_name: 'Omar Bakr', company_name: 'Bakr Consulting', service_type: 'landing_page', value: 3500, stage: 'deal_in_meeting', notes: 'High-converting landing page for ads', created_at: '2024-04-03', updated_at: '2024-04-03' },
  { id: '4', client_name: 'Layla Hassan', company_name: 'Hassan Corp', service_type: 'website_redesign', value: 6000, stage: 'paid_deposit', notes: 'Deposit received, starting design phase', created_at: '2024-04-04', updated_at: '2024-04-04' },
];

export default function PipelinePage() {
  const [cards, setCards] = useState<PipelineCard[]>(initialCards);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<PipelineCard | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const totalValue = cards.reduce((sum, c) => sum + (c.value || 0), 0);

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDrop = (stage: PipelineStage) => {
    if (!draggingId) return;
    setCards((prev) => prev.map((c) => c.id === draggingId ? { ...c, stage, updated_at: new Date().toISOString() } : c));
    setDraggingId(null);
  };

  const handleSave = (card: PipelineCard) => {
    if (editingCard) {
      setCards((prev) => prev.map((c) => c.id === card.id ? card : c));
    } else {
      setCards((prev) => [...prev, { ...card, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
    }
    setShowModal(false);
    setEditingCard(null);
  };

  const handleDelete = (id: string) => setCards((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
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

      {/* Board */}
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
