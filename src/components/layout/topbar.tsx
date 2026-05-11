'use client';

import { Bell, Search } from 'lucide-react';

export function Topbar() {
  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3 bg-surface2 rounded-lg px-3 py-2 w-64">
        <Search size={15} className="text-text-faint" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-text-primary placeholder-text-faint focus:outline-none w-full"
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-surface2 transition-colors">
          <Bell size={18} className="text-text-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">A</span>
        </div>
      </div>
    </header>
  );
}
