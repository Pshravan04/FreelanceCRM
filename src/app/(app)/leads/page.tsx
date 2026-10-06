'use client';

import { Suspense, useState, useEffect } from 'react';
import { getLeads, deleteLead, updateLead } from '@/lib/services/data';
import type { Lead, LeadStatus } from '@/lib/types';
import { formatCurrency, formatDate, getStatusColor, LEAD_STATUSES, LEAD_SOURCES } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { Plus, Search, LayoutGrid, Table2, Filter, MoreHorizontal, Trash2, Edit2, UserCheck, ExternalLink } from 'lucide-react';
import { AddLeadModal } from '@/components/leads/add-lead-modal';
import { LeadKanban } from '@/components/leads/lead-kanban';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

function LeadsContent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new')) setAddModalOpen(true);
  }, [searchParams]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await getLeads({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      });
      setLeads(data);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    try {
      await deleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success('Lead deleted');
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      await updateLead(id, { status });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const currency = 'INR';
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Leads</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {leads.length} leads · {formatCurrency(totalValue, currency)} total value
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => setView('table')}
              className={cn('p-2 transition-colors', view === 'table' ? 'bg-[var(--color-foreground)] text-[var(--color-background)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]')}
            >
              <Table2 size={15} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn('p-2 transition-colors', view === 'kanban' ? 'bg-[var(--color-foreground)] text-[var(--color-background)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]')}
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={cn('px-3 py-1 text-xs rounded-full border font-medium transition-colors', !statusFilter ? 'bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]' : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-muted-foreground)]')}
        >
          All ({leads.length})
        </button>
        {LEAD_STATUSES.map(s => {
          const count = leads.filter(l => l.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={cn('px-3 py-1 text-xs rounded-full border font-medium transition-colors', statusFilter === s ? 'bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]' : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-muted-foreground)]')}
            >
              {STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* Table view */}
      {view === 'table' && (
        <div className="card overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : leads.length === 0 ? (
            <EmptyState onAdd={() => setAddModalOpen(true)} />
          ) : (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Company</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Value</th>
                  <th className="text-left">Source</th>
                  <th className="text-left">Follow-up</th>
                  <th className="text-left">Created</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                    <td onClick={e => e.stopPropagation()}>
                      <Link href={`/leads/${lead.id}`} className="font-medium text-[var(--color-foreground)] hover:underline">
                        {lead.name}
                      </Link>
                      {lead.email && <p className="text-xs text-[var(--color-muted-foreground)]">{lead.email}</p>}
                    </td>
                    <td className="text-[var(--color-muted-foreground)]">{lead.company || '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className={cn('text-xs font-medium px-2 py-1 rounded-md border cursor-pointer focus:outline-none', getStatusColor(lead.status))}
                        onClick={e => e.stopPropagation()}
                      >
                        {LEAD_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td className="font-medium">{formatCurrency(lead.estimated_value, currency)}</td>
                    <td className="text-[var(--color-muted-foreground)] text-xs">{lead.source}</td>
                    <td className="text-[var(--color-muted-foreground)] text-xs">{formatDate(lead.next_follow_up)}</td>
                    <td className="text-[var(--color-muted-foreground)] text-xs">{formatDate(lead.created_at)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === lead.id ? null : lead.id)}
                          className="p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenuId === lead.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 overflow-hidden animate-fade-in">
                            <Link href={`/leads/${lead.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => setOpenMenuId(null)}>
                              <ExternalLink size={13} /> View
                            </Link>
                            <Link href={`/leads/${lead.id}?edit=1`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => setOpenMenuId(null)}>
                              <Edit2 size={13} /> Edit
                            </Link>
                            <button onClick={() => handleDelete(lead.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <LeadKanban leads={leads} onUpdate={loadLeads} />
      )}

      {/* Add Lead Modal */}
      <AddLeadModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { loadLeads(); setAddModalOpen(false); }}
      />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-muted-foreground)]">Loading leads...</div>}>
      <LeadsContent />
    </Suspense>
  );
}
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl mb-4">🎯</div>
      <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-2">No leads yet</h3>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6 max-w-xs mx-auto">
        Start building your pipeline by adding your first lead.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90"
      >
        <Plus size={16} />
        Add your first lead
      </button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}
