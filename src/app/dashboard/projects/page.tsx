'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Project } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  in_progress: 'bg-blue-500/10 text-blue-400',
  waiting_review: 'bg-purple-500/10 text-purple-400',
  completed: 'bg-accent/10 text-accent',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  waiting_review: 'Waiting Review',
  completed: 'Completed',
};

const SERVICE_LABELS: Record<string, string> = {
  website_design: 'Website Design',
  website_redesign: 'Redesign',
  landing_page: 'Landing Page',
  maintenance: 'Maintenance',
  ecommerce: 'E-commerce',
};

const mockProjects: Project[] = [
  { id: '1', name: 'Al-Rashid Group Website', service_type: 'website_design', status: 'in_progress', budget: 8000, cost: 2000, deadline: '2024-05-01', created_at: '2024-04-01' },
  { id: '2', name: 'Nora Fashion E-store', service_type: 'ecommerce', status: 'pending', budget: 15000, cost: 4000, deadline: '2024-06-15', created_at: '2024-04-05' },
  { id: '3', name: 'Bakr Consulting Landing Page', service_type: 'landing_page', status: 'waiting_review', budget: 3500, cost: 800, deadline: '2024-04-20', created_at: '2024-04-03' },
  { id: '4', name: 'Hassan Corp Redesign', service_type: 'website_redesign', status: 'completed', budget: 6000, cost: 1500, created_at: '2024-03-01' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  const deleteProject = (id: string) => {
    if (!confirm('Delete this project?')) return;
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-muted text-sm">{projects.length} total projects</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(project => (
          <div key={project.id} className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-text-primary font-semibold text-sm">{project.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
            </div>
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Service</span>
                <span className="text-text-primary">{SERVICE_LABELS[project.service_type]}</span>
              </div>
              <div className="flex justify-between">
                <span>Budget</span>
                <span className="text-accent font-medium">{formatCurrency(project.budget || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Profit</span>
                <span className="text-text-primary">{formatCurrency((project.budget || 0) - (project.cost || 0))}</span>
              </div>
              {project.deadline && (
                <div className="flex justify-between">
                  <span>Deadline</span>
                  <span className="text-yellow-400">{formatDate(project.deadline)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
              <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-primary py-1.5 hover:bg-surface2 rounded-lg transition-colors">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => deleteProject(project.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-red-400 py-1.5 hover:bg-surface2 rounded-lg transition-colors">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
