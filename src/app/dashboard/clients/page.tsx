'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { ClientCard } from '@/components/clients/client-card';
import { ClientModal } from '@/components/clients/client-modal';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Client } from '@/types';

const statusFilters = ['all', 'active', 'inactive', 'prospect'];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else if (data) {
      setClients(data as Client[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (client: Client) => {
    if (editingClient) {
      // UPDATE — keep the id
      const { error: err } = await supabase
        .from('clients')
        .update({
          full_name: client.full_name,
          company_name: client.company_name,
          email: client.email,
          phone: client.phone,
          whatsapp: client.whatsapp,
          country: client.country,
          industry: client.industry,
          website_url: client.website_url,
          notes: client.notes,
          status: client.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);
      if (err) { setError(err.message); return; }
    } else {
      // INSERT — do NOT send id, let Supabase generate the UUID
      const { error: err } = await supabase.from('clients').insert([{
        full_name: client.full_name,
        company_name: client.company_name,
        email: client.email,
        phone: client.phone,
        whatsapp: client.whatsapp,
        country: client.country,
        industry: client.industry,
        website_url: client.website_url,
        notes: client.notes,
        status: client.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      if (err) { setError(err.message); return; }
    }
    setShowModal(false);
    setEditingClient(null);
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id);
    fetchClients();
  };

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

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          ⚠️ Error: {error}
        </div>
      )}

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

      {loading ? (
        <div className="text-center py-16">
          <p className="text-text-muted">Loading clients...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted">No clients found</p>
          <button
            onClick={() => { setEditingClient(null); setShowModal(true); }}
            className="mt-3 text-primary text-sm hover:underline"
          >
            Add your first client
          </button>
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
