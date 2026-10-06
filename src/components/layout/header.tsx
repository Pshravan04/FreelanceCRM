'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Bell, Plus, Command } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { CommandMenu } from '@/components/command-menu';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/clients': 'Clients',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
  '/calendar': 'Calendar',
  '/analytics': 'Analytics',
  '/files': 'Files',
  '/notes': 'Notes',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

export function Header() {
  const { profile } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    key === pathname || pathname.startsWith(key + '/')
  )?.[1] || 'FreelanceCRM';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center px-6 gap-4 flex-shrink-0">
        {/* Page title */}
        <h1 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h1>

        <div className="flex-1" />

        {/* Search trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-muted-foreground)] bg-[var(--color-muted)] border border-[var(--color-border)] rounded-md hover:border-[var(--color-muted-foreground)] transition-colors"
        >
          <Search size={13} />
          <span>Search...</span>
          <kbd className="ml-8 flex items-center gap-0.5 text-xs opacity-70">
            <Command size={11} />K
          </kbd>
        </button>

        {/* Quick add */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Quick Add
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-md transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
        </div>
      </header>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  );
}
