'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Folder, Bell, FileText, User } from 'lucide-react';

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show layout on login page
  if (pathname === '/client-portal/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Overview', href: '/client-portal', icon: Home },
    { name: 'Projects', href: '/client-portal/projects', icon: Folder },
    { name: 'Updates', href: '/client-portal/updates', icon: Bell },
    { name: 'Invoices', href: '/client-portal/invoices', icon: FileText },
    { name: 'Profile', href: '/client-portal/profile', icon: User },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      {/* Desktop Sidebar (Optional, maybe just header for clients) */}
      <div className="hidden md:flex w-64 flex-col border-r border-[var(--color-border)] bg-white dark:bg-zinc-950">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">Client Workspace</h2>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[var(--color-foreground)] text-[var(--color-background)]' 
                    : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)]'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative pb-[env(safe-area-inset-bottom)] md:pb-0">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 pt-[max(env(safe-area-inset-top),16px)]">
          <h1 className="font-bold text-lg">Client Workspace</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="animate-fade-in p-4 md:p-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                    isActive ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
