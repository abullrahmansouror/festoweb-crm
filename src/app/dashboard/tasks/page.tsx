'use client';

import { useState } from 'react';
import { Plus, CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import type { Task } from '@/types';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-accent bg-accent/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  high: 'text-red-400 bg-red-400/10',
};

const initialTasks: Task[] = [
  { id: '1', title: 'Design homepage wireframe for Faisal', client_name: 'Faisal Al-Dosari', status: 'in_progress', priority: 'high', due_date: '2024-04-12', created_at: '2024-04-01' },
  { id: '2', title: 'Upload product images to Nora store', client_name: 'Nora Fashion', status: 'todo', priority: 'medium', due_date: '2024-04-15', created_at: '2024-04-02' },
  { id: '3', title: 'Follow up with Omar Bakr invoice', client_name: 'Omar Bakr', status: 'todo', priority: 'high', due_date: '2024-04-08', created_at: '2024-04-03' },
  { id: '4', title: 'Update Festoweb portfolio page', status: 'done', priority: 'low', created_at: '2024-04-01' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [newTitle, setNewTitle] = useState('');

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const toggle = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t));

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), title: newTitle.trim(), status: 'todo', priority: 'medium', created_at: new Date().toISOString() }]);
    setNewTitle('');
  };

  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const counts = { all: tasks.length, todo: tasks.filter(t=>t.status==='todo').length, in_progress: tasks.filter(t=>t.status==='in_progress').length, done: tasks.filter(t=>t.status==='done').length };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
        <p className="text-text-muted text-sm mt-1">{counts.todo} pending · {counts.in_progress} in progress · {counts.done} done</p>
      </div>

      {/* Add task quick bar */}
      <div className="flex gap-3">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a new task... (press Enter)"
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-primary"
        />
        <button onClick={addTask} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all','todo','in_progress','done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted hover:text-text-primary'
            }`}
          >
            {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase()+f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.map(task => (
          <div key={task.id} className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3 hover:border-primary/20 transition-colors">
            <button onClick={() => toggle(task.id)} className="mt-0.5 shrink-0">
              {task.status === 'done' ? <CheckCircle2 size={18} className="text-accent" /> : <Circle size={18} className="text-text-faint" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-text-faint' : 'text-text-primary'}`}>{task.title}</p>
              <div className="flex items-center gap-3 mt-1.5">
                {task.client_name && <span className="text-text-faint text-xs">{task.client_name}</span>}
                <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                {task.due_date && (
                  <div className="flex items-center gap-1 text-text-faint text-xs">
                    <Clock size={10} />{task.due_date}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => deleteTask(task.id)} className="text-text-faint hover:text-red-400 text-xs transition-colors shrink-0">×</button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle2 size={32} className="text-text-faint mx-auto mb-3" />
            <p className="text-text-muted text-sm">No tasks here. You&apos;re clear! ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}
