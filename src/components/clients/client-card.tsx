'use client';

import { Globe, Mail, Phone, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Client } from '@/types';

const statusColors: Record<string, string> = {
  active: 'bg-accent/10 text-accent',
  inactive: 'bg-red-400/10 text-red-400',
  prospect: 'bg-warning/10 text-warning',
};

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 transition-colors relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-primary font-bold">{client.full_name[0]}</span>
          </div>
          <div>
            <p className="text-text-primary font-semibold">{client.full_name}</p>
            <p className="text-text-muted text-xs">{client.company_name || '—'}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded hover:bg-surface2 transition-colors">
            <MoreVertical size={15} className="text-text-faint" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 bg-surface2 border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
              <button onClick={() => { onEdit(client); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface transition-colors">
                <Edit size={13} /> Edit
              </button>
              <button onClick={() => { onDelete(client.id); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-surface transition-colors">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <span className={cn('text-xs px-2 py-1 rounded-full font-medium capitalize', statusColors[client.status])}>
        {client.status}
      </span>

      {/* Info */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-text-muted text-xs">
          <Mail size={12} />
          <span className="truncate">{client.email}</span>
        </div>
        {client.phone && (
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <Phone size={12} />
            <span>{client.phone}</span>
          </div>
        )}
        {client.website_url && (
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <Globe size={12} />
            <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary transition-colors">{client.website_url}</a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-text-faint text-xs">{client.country || '—'}</span>
        <span className="text-text-faint text-xs">{client.industry || '—'}</span>
      </div>
    </div>
  );
}
