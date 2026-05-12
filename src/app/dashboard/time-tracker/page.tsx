'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import type { TimeEntry } from '@/types';
import { formatDuration } from '@/lib/utils';

const initialEntries: TimeEntry[] = [
  { id: '1', description: 'Homepage design - Faisal project', client_name: 'Faisal Al-Dosari', duration: 5400, started_at: '2024-04-08T09:00:00Z', ended_at: '2024-04-08T10:30:00Z' },
  { id: '2', description: 'Product upload - Nora store', client_name: 'Nora Fashion', duration: 3600, started_at: '2024-04-08T11:00:00Z', ended_at: '2024-04-08T12:00:00Z' },
  { id: '3', description: 'Client meeting - Omar Bakr', client_name: 'Omar Bakr', duration: 2700, started_at: '2024-04-08T14:00:00Z', ended_at: '2024-04-08T14:45:00Z' },
];

export default function TimeTrackerPage() {
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [desc, setDesc] = useState('');
  const [client, setClient] = useState('');
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const start = () => {
    setRunning(true);
    startRef.current = Date.now() - elapsed * 1000;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
  };

  const pause = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const stop = () => {
    pause();
    if (elapsed > 0) {
      setEntries(prev => [{ id: Date.now().toString(), description: desc || 'Untitled session', client_name: client || undefined, duration: elapsed, started_at: new Date(Date.now() - elapsed * 1000).toISOString(), ended_at: new Date().toISOString() }, ...prev]);
    }
    setElapsed(0);
    setDesc('');
    setClient('');
  };

  const totalToday = entries.reduce((s, e) => s + e.duration, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Time Tracker</h1>
        <p className="text-text-muted text-sm mt-1">Today: {formatDuration(totalToday)} logged</p>
      </div>

      {/* Timer Card */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-text-primary tabular-nums mb-2">{formatDuration(elapsed)}</div>
          <p className="text-text-faint text-sm">{running ? '⏺ Recording...' : 'Ready to track'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-text-muted text-xs mb-1 block">What are you working on?</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Homepage design" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-text-muted text-xs mb-1 block">Client (optional)</label>
            <input value={client} onChange={e => setClient(e.target.value)} placeholder="Client name" className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          {!running ? (
            <button onClick={start} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <Play size={16} /> Start
            </button>
          ) : (
            <button onClick={pause} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <Pause size={16} /> Pause
            </button>
          )}
          {elapsed > 0 && (
            <button onClick={stop} className="flex items-center gap-2 bg-surface2 border border-border text-text-muted hover:text-red-400 px-4 py-2.5 rounded-lg text-sm transition-colors">
              <Square size={14} /> Stop & Save
            </button>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <p className="text-text-primary font-semibold">Recent Sessions</p>
          <span className="text-text-faint text-xs">{entries.length} sessions</span>
        </div>
        <div className="divide-y divide-border">
          {entries.map(entry => (
            <div key={entry.id} className="px-4 py-3 flex items-center justify-between hover:bg-surface2 transition-colors">
              <div>
                <p className="text-text-primary text-sm font-medium">{entry.description}</p>
                {entry.client_name && <p className="text-text-faint text-xs mt-0.5">{entry.client_name}</p>}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-accent">
                  <Clock size={12} />
                  <span className="text-sm font-semibold tabular-nums">{formatDuration(entry.duration)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
