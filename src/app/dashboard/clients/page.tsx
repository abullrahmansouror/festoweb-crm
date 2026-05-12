'use client';

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { ClientCard } from '@/components/clients/client-card';
import { ClientModal } from '@/components/clients/client-modal';
import { cn } from '@/lib/utils';
import type { Client } from '@/types';

const mockClients: Client[] = [
  { id: '1', full_name: 'Ahmed Al-Rashid', company_name: 'Al-Rashid Group', email: 'ahmed@alrashid.com', phone: '+966501234567', status: 'active', created_at: '2024-01-15' },
  { id: '2', full_name: 'Mohammed Salem', company_name: 'Salem Stores', email: 'mohammed@salem.com', phone: '+966507654321', status: 'active', created_at: '2024-02-10' },
  { id: '3', full_name: 'Sarah Johnson', company_name: 'TechVision Ltd', email: 'sarah@techvision.com', phone: '+1234567890', status: 'active', created_at: '2024-03-05' },
  { id: '4', full_name: 'Khalid Al-Otaibi', company_name: 'Otaibi Real Estate', email: 'khalid@otaibi.com', phone: '+966509876543', status: 'prospect', created_at: '2024-03-20' },
];

const statusFilters = ['all', 'active', 'inactive', 'prospect'];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = (client: Client) => {
    if (editingClient) {
      setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    } else {
      setClients((prev) => [...prev, { ...client, id: Date.now().toString(), created_at: new Date().toISOString() }]);
    }
    setShowModal(false);
    setEditingClient(null);
  };

  const handleDelete = (id: string) => setClients((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Clients</h1>
          <p className="text-text-muted text-sm mt-1">{clients.length} total clients</p>
        </div>
        <button
          onClick={() => { setEditingClient(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 flex-1">
          <Search size={15} className="text-text-faint" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-text-primary placeholder-text-faint focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-text-faint" />
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors',
                statusFilter === s ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted hover:text-text-primary'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted">No clients found</p>
          <button onClick={() => { setEditingClient(null); setShowModal(true); }} className="mt-3 text-primary text-sm hover:underline">Add your first client</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={(c) => { setEditingClient(c); setShowModal(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ClientModal
          client={editingClient}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingClient(null); }}
        />
      )}
    </div>
  );
}
