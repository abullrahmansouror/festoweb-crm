'use client';

import { useState } from 'react';
import { Plus, Mail, Phone, MoreHorizontal } from 'lucide-react';
import type { TeamMember } from '@/types';

const AVATAR_COLORS = ['bg-primary/20 text-primary', 'bg-accent/20 text-accent', 'bg-purple-400/20 text-purple-400', 'bg-orange-400/20 text-orange-400'];

const initialMembers: TeamMember[] = [
  { id: '1', name: 'Abdulrhman (You)', role: 'owner', email: 'abdulrhman@festoweb.com', phone: '+966-5XX-XXXXX', status: 'active', joined_at: '2023-01-01' },
  { id: '2', name: 'Ahmed Al-Rashidi', role: 'developer', email: 'ahmed@festoweb.com', phone: '+966-5XX-XXXXX', status: 'active', joined_at: '2023-06-01' },
  { id: '3', name: 'Sara Khalid', role: 'designer', email: 'sara@festoweb.com', status: 'active', joined_at: '2024-01-15' },
  { id: '4', name: 'Mohammed Eid', role: 'sales', email: 'mohammed@festoweb.com', status: 'inactive', joined_at: '2023-09-01' },
];

const roleBadge: Record<string, string> = {
  owner: 'bg-primary/10 text-primary',
  developer: 'bg-blue-400/10 text-blue-400',
  designer: 'bg-purple-400/10 text-purple-400',
  sales: 'bg-accent/10 text-accent',
};

export default function TeamPage() {
  const [members] = useState<TeamMember[]>(initialMembers);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Team</h1>
          <p className="text-text-muted text-sm mt-1">{members.filter(m=>m.status==='active').length} active members</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member, i) => (
          <div key={member.id} className="bg-surface border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${AVATAR_COLORS[i % 4]}`}>
                  {member.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                </div>
                <div>
                  <p className="text-text-primary text-sm font-semibold">{member.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${roleBadge[member.role]}`}>{member.role}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-accent' : 'bg-text-faint'}`} />
                <button className="p-1 rounded hover:bg-surface2 text-text-faint"><MoreHorizontal size={14} /></button>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-text-faint text-xs">
                <Mail size={11} />{member.email}
              </div>
              {member.phone && <div className="flex items-center gap-2 text-text-faint text-xs"><Phone size={11} />{member.phone}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
