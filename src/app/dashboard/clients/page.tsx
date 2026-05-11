'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/types';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { ClientModal } from '@/components/clients/client-modal';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  async function fetchClients() {
    const supabase = createClient();
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchClients(); }, []);

  async function deleteClient(id: string) {
    if (!confirm('Delete this client?')) return;
    const supabase = createClient();
    await supabase.from('clients').delete().eq('id', id);
    fetchClients();
  }

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => ({
    active: 'bg-accent/10 text-accent',
    inactive: 'bg-error/10 text-error',
    prospect: 'bg-warning/10 text-warning',
  }[s] || '');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Clients</h1>
          <p className="text-text-muted text-sm">{clients.length} total clients</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-3 py-2 w-full max-w-sm">
        <Search size={15} className="text-text-faint" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="bg-transparent text-sm text-text-primary placeholder-text-faint focus:outline-none w-full" />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Name', 'Company', 'Email', 'Country', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs text-text-faint font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-text-muted">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-text-muted">No clients found</td></tr>
            ) : filtered.map(client => (
              <tr key={client.id} className="border-b border-border hover:bg-surface2 transition-colors">
                <td className="px-4 py-3 text-sm text-text-primary font-medium">{client.full_name}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{client.company_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{client.email}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{client.country || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(client.status)}`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-text-faint">{formatDate(client.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {client.website_url && (
                      <a href={client.website_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 hover:bg-surface2 rounded text-text-faint hover:text-text-primary transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button onClick={() => { setEditing(client); setShowModal(true); }}
                      className="p-1.5 hover:bg-surface2 rounded text-text-faint hover:text-primary transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteClient(client.id)}
                      className="p-1.5 hover:bg-surface2 rounded text-text-faint hover:text-error transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ClientModal
          client={editing}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchClients(); }}
        />
      )}
    </div>
  );
}
