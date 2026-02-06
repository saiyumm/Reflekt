import type { ReactNode } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SIDEBAR_KEY } from '@/lib/constants';
import type { Stats } from '@/types';
import { api } from '@/lib/api';

interface AppShellProps {
  children: ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
}

export function AppShell({ children, search, onSearchChange }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored !== 'true'; // default to open
  });
  const [stats, setStats] = useState<Stats | null>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(!next));
      return next;
    });
  }, []);

  // Fetch stats on mount
  useEffect(() => {
    api.stats.get().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <Header
        search={search}
        onSearchChange={onSearchChange}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} stats={stats} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
