'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users2, UserCheck, FolderKanban, CheckSquare, FileText, ArrowRight, X } from 'lucide-react';
import { globalSearch } from '@/lib/services/data';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Go to Dashboard', href: '/dashboard', icon: ArrowRight },
  { label: 'Go to Leads', href: '/leads', icon: Users2 },
  { label: 'Go to Clients', href: '/clients', icon: UserCheck },
  { label: 'Go to Projects', href: '/projects', icon: FolderKanban },
  { label: 'Go to Invoices', href: '/invoices', icon: FileText },
  { label: 'Go to Tasks', href: '/tasks', icon: CheckSquare },
];

export function CommandMenu({ open, onClose }: CommandMenuProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof globalSearch>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    globalSearch(debouncedQuery).then((res) => {
      setResults(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [debouncedQuery]);

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const allResults = results ? [
    ...results.leads.map(l => ({ type: 'Lead', label: l.name, href: `/leads/${l.id}`, icon: Users2, sub: l.company })),
    ...results.clients.map(c => ({ type: 'Client', label: c.name, href: `/clients/${c.id}`, icon: UserCheck, sub: c.company })),
    ...results.projects.map(p => ({ type: 'Project', label: p.name, href: `/projects/${p.id}`, icon: FolderKanban, sub: p.status })),
    ...results.tasks.map(t => ({ type: 'Task', label: t.title, href: `/tasks`, icon: CheckSquare, sub: t.status })),
    ...results.invoices.map(i => ({ type: 'Invoice', label: i.invoice_number, href: `/invoices/${i.id}`, icon: FileText, sub: i.status })),
  ] : [];

  const items = query ? allResults : QUICK_ACTIONS.map(a => ({ ...a, type: 'Navigation', sub: '' }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, items.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && items[selectedIndex]) navigate(items[selectedIndex].href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search size={16} className="text-[var(--color-muted-foreground)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search leads, clients, projects..."
            className="flex-1 bg-transparent outline-none text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              <X size={14} />
            </button>
          )}
          <kbd className="text-xs text-[var(--color-muted-foreground)] border border-[var(--color-border)] rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              Searching...
            </div>
          )}

          {!loading && items.length === 0 && query && (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              No results for &quot;{query}&quot;
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="px-2">
              {!query && <p className="px-2 py-1 text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Quick Navigation</p>}
              {query && allResults.length > 0 && <p className="px-2 py-1 text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Results</p>}
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                      selectedIndex === i ? 'bg-[var(--color-foreground)] text-[var(--color-background)]' : 'hover:bg-[var(--color-muted)]'
                    )}
                  >
                    <Icon size={15} className="flex-shrink-0" />
                    <span className="flex-1 truncate font-medium">{item.label}</span>
                    {item.sub && <span className={cn('text-xs', selectedIndex === i ? 'opacity-70' : 'text-[var(--color-muted-foreground)]')}>{item.sub}</span>}
                    <span className={cn('text-xs px-1.5 py-0.5 rounded border', selectedIndex === i ? 'border-white/30 text-white/70' : 'border-[var(--color-border)] text-[var(--color-muted-foreground)]')}>{item.type}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] px-4 py-2 flex items-center gap-4 text-xs text-[var(--color-muted-foreground)]">
          <span><kbd className="border border-[var(--color-border)] rounded px-1 py-0.5">↑↓</kbd> navigate</span>
          <span><kbd className="border border-[var(--color-border)] rounded px-1 py-0.5">↵</kbd> open</span>
          <span><kbd className="border border-[var(--color-border)] rounded px-1 py-0.5">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
