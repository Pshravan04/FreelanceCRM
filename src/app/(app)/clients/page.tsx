'use client';

import { Suspense, useState, useEffect } from 'react';
import { getClients, deleteClient, updateClient } from '@/lib/services/data';
import type { Client } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, Trash2, Edit2, ExternalLink, Mail, Phone } from 'lucide-react';
import { AddClientModal } from '@/components/clients/add-client-modal';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function ClientsContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new')) setAddModalOpen(true);
  }, [searchParams]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getClients({
        is_active: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined,
        search: debouncedSearch || undefined,
      });
      setClients(data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    try {
      await deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
      toast.success('Client deleted');
    } catch {
      toast.error('Failed to delete client');
    }
  };

  const handleStatusChange = async (id: string, is_active: boolean) => {
    try {
      await updateClient(id, { is_active });
      setClients(prev => prev.map(c => c.id === id ? { ...c, is_active } : c));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Clients</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {clients.length} total clients
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden pb-16 md:pb-0">
        {loading ? (
          <TableSkeleton />
        ) : clients.length === 0 ? (
          <EmptyState onAdd={() => setAddModalOpen(true)} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="text-left">Client</th>
                    <th className="text-left">Contact</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Added On</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="cursor-pointer" onClick={() => router.push(`/clients/${client.id}`)}>
                      <td onClick={e => e.stopPropagation()}>
                        <Link href={`/clients/${client.id}`} className="font-medium text-[var(--color-foreground)] hover:underline">
                          {client.name}
                        </Link>
                        {client.company && <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{client.company}</p>}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col gap-1">
                          {client.email && (
                            <a href={`mailto:${client.email}`} className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-1.5">
                              <Mail size={12} /> {client.email}
                            </a>
                          )}
                          {client.phone && (
                            <a href={`tel:${client.phone}`} className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-1.5">
                              <Phone size={12} /> {client.phone}
                            </a>
                          )}
                          {!client.email && !client.phone && <span className="text-xs text-[var(--color-muted-foreground)]">—</span>}
                        </div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={client.is_active ? 'ACTIVE' : 'INACTIVE'}
                          onChange={(e) => handleStatusChange(client.id, e.target.value === 'ACTIVE')}
                          className={cn(
                            'text-xs font-medium px-2 py-1 rounded-md border cursor-pointer focus:outline-none',
                            client.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                          )}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </td>
                      <td className="text-[var(--color-muted-foreground)] text-xs">{formatDate(client.created_at)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                            className="p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {openMenuId === client.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 overflow-hidden animate-fade-in">
                              <Link href={`/clients/${client.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => setOpenMenuId(null)}>
                                <ExternalLink size={13} /> View
                              </Link>
                              <Link href={`/clients/${client.id}?edit=1`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => setOpenMenuId(null)}>
                                <Edit2 size={13} /> Edit
                              </Link>
                              <button onClick={() => { handleDelete(client.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
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
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden flex flex-col divide-y divide-[var(--color-border)]">
              {clients.map((client) => (
                <div key={client.id} onClick={() => router.push(`/clients/${client.id}`)} className="p-4 active:bg-[var(--color-muted)] transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-base text-[var(--color-foreground)]">{client.name}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{client.company || '—'}</span>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', client.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200')}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 mt-3">
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <Mail size={12} /> {client.email}
                      </a>
                    )}
                    {client.phone && (
                      <a href={`tel:${client.phone}`} className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <Phone size={12} /> {client.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AddClientModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { loadClients(); setAddModalOpen(false); }}
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-muted-foreground)]">Loading clients...</div>}>
      <ClientsContent />
    </Suspense>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl mb-4">🤝</div>
      <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-2">No clients found</h3>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6 max-w-xs mx-auto">
        Add your first client to start managing projects and invoices for them.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90"
      >
        <Plus size={16} />
        Add Client
      </button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}
