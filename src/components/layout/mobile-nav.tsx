'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, Plus, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from './bottom-sheet';

export function MobileNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainLinks = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/leads', label: 'Leads', icon: Users },
    { href: '/clients', label: 'Clients', icon: Briefcase },
  ];

  const moreLinks = [
    { href: '/projects', label: 'Projects' },
    { href: '/invoices', label: 'Invoices' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/payments', label: 'Payments' },
    { href: '/follow-ups', label: 'Follow Ups' },
    { href: '/settings', label: 'Settings' },
  ];

  const addActions = [
    { href: '/leads?new=true', label: 'Add Lead' },
    { href: '/clients?new=true', label: 'Add Client' },
    { href: '/projects?new=true', label: 'Create Project' },
    { href: '/invoices?new=true', label: 'Create Invoice' },
  ];

  return (
    <>
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-card)] border-t border-[var(--color-border)] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-2 h-16">
          {mainLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors",
                  isActive ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"
                )}
              >
                <link.icon size={20} className={isActive ? "fill-current/10" : ""} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}

          {/* Add FAB (Floating Action Button) */}
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex-1 flex flex-col items-center justify-center h-full group relative -top-3"
          >
            <div className="w-12 h-12 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
              <Plus size={24} />
            </div>
          </button>

          <button 
            onClick={() => setIsMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full text-[var(--color-muted-foreground)]"
          >
            <Menu size={20} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Add Action Sheet */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New">
        <div className="grid grid-cols-2 gap-3">
          {addActions.map((action) => (
            <Link 
              key={action.href}
              href={action.href}
              onClick={() => setIsAddOpen(false)}
              className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-center font-medium active:bg-[var(--color-muted)] transition-colors"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </BottomSheet>

      {/* More Menu Sheet */}
      <BottomSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} title="Menu">
        <div className="flex flex-col gap-2">
          {moreLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              onClick={() => setIsMoreOpen(false)}
              className="p-4 rounded-xl flex items-center text-base font-medium active:bg-[var(--color-muted)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
