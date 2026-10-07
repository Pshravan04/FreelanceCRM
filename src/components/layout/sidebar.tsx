'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Users2, UserCheck, FolderKanban, CheckSquare,
  FileText, CreditCard, Calendar, BarChart2, FolderOpen, StickyNote,
  Settings, ChevronDown, LogOut, User, Moon, Sun,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/contexts/theme-context';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Users2, label: 'Leads' },
  { href: '/clients', icon: UserCheck, label: 'Clients' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/freelancers', icon: Users2, label: 'Freelancers' },
];

const secondaryItems = [
  { href: '/files', icon: FolderOpen, label: 'Files' },
  { href: '/notes', icon: StickyNote, label: 'Notes' },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-60 h-full flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--color-border)]">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
          <div className="w-7 h-7 bg-[var(--color-foreground)] rounded-md flex items-center justify-center">
            <Zap size={14} className="text-[var(--color-background)]" />
          </div>
          <span className="text-sm font-bold tracking-tight">FreelanceCRM</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </div>

        <div className="my-3 border-t border-[var(--color-border)]" />

        <div className="space-y-0.5">
          {secondaryItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </div>

        <div className="my-3 border-t border-[var(--color-border)]" />

        <NavItem href="/settings" icon={Settings} label="Settings" active={isActive('/settings')} onClick={onClose} />
      </nav>

      {/* User menu */}
      <div className="border-t border-[var(--color-border)] p-2">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[var(--color-muted)] transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--color-foreground)] text-[var(--color-background)] flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {profile?.full_name ? getInitials(profile.full_name) : getInitials(user?.email || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-[var(--color-foreground)]">
                {profile?.full_name || 'Your Name'}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                {user?.email}
              </p>
            </div>
            <ChevronDown size={14} className="text-[var(--color-muted-foreground)] flex-shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)] transition-colors"
                onClick={() => setUserMenuOpen(false)}
              >
                <User size={14} />
                Profile
              </Link>
              <button
                onClick={() => {
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)] transition-colors"
              >
                {resolvedTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <div className="border-t border-[var(--color-border)]" />
              <button
                onClick={() => { signOut(); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors font-medium',
        active
          ? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
          : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}
