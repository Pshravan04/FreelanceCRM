'use client';

import { Suspense, useState, useEffect } from 'react';
import { getInvoices, deleteInvoice, getClients, getProjects } from '@/lib/services/data';
import type { Invoice, Client, Project } from '@/lib/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, Trash2, Edit2, ExternalLink, Download, FileText } from 'lucide-react';
import { AddInvoiceModal } from '@/components/invoices/add-invoice-modal';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function InvoicesContent() {
  const [invoices, setInvoices] = useState<(Invoice & { client: { name: string } })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, clientData, projData] = await Promise.all([
        getInvoices({
          status: statusFilter ? (statusFilter as any) : undefined,
          search: debouncedSearch || undefined,
        }),
        getClients(),
        getProjects()
      ]);
      setInvoices(invData as any);
      setClients(clientData);
      setProjects(projData);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    try {
      await deleteInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
      toast.success('Invoice deleted');
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  const totalOutstanding = invoices
    .filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Invoices</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {formatCurrency(totalOutstanding, 'INR')} outstanding
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-10 w-full rounded" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={48} className="mx-auto text-[var(--color-muted-foreground)] opacity-50 mb-4" />
            <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-2">No invoices found</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6 max-w-xs mx-auto">
              Create your first invoice to get paid for your freelance work.
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90"
            >
              <Plus size={16} />
              Create Invoice
            </button>
          </div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Invoice #</th>
                <th className="text-left">Client</th>
                <th className="text-left">Status</th>
                <th className="text-left">Issue Date</th>
                <th className="text-left">Due Date</th>
                <th className="text-right">Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice.id} className="cursor-pointer" onClick={() => router.push(`/invoices/${invoice.id}`)}>
                  <td className="font-medium text-[var(--color-foreground)]">{invoice.invoice_number}</td>
                  <td className="text-[var(--color-muted-foreground)]">{invoice.client?.name}</td>
                  <td>
                    <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', getStatusColor(invoice.status))}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="text-[var(--color-muted-foreground)] text-xs">{formatDate(invoice.issue_date)}</td>
                  <td className={cn("text-xs font-medium", new Date(invoice.due_date || '') < new Date() && invoice.status !== 'PAID' ? 'text-red-600' : 'text-[var(--color-muted-foreground)]')}>
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="text-right font-semibold text-[var(--color-foreground)]">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === invoice.id ? null : invoice.id)} className="p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                        <MoreHorizontal size={15} />
                      </button>
                      {openMenuId === invoice.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 overflow-hidden animate-fade-in">
                          <Link href={`/invoices/${invoice.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => setOpenMenuId(null)}>
                            <ExternalLink size={13} /> View
                          </Link>
                          <Link href={`/invoices/${invoice.id}?edit=1`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => setOpenMenuId(null)}>
                            <Edit2 size={13} /> Edit
                          </Link>
                          <button onClick={async () => { 
                            setOpenMenuId(null);
                            try {
                              const { getInvoice } = await import('@/lib/services/data');
                              const { generateInvoicePDF } = await import('@/lib/pdf');
                              const fullInvoice = await getInvoice(invoice.id);
                              if (fullInvoice && fullInvoice.client && fullInvoice.invoice_items) {
                                generateInvoicePDF(fullInvoice, fullInvoice.client, fullInvoice.invoice_items);
                                toast.success('PDF downloaded');
                              }
                            } catch (e) {
                              toast.error('Failed to generate PDF');
                              console.error(e);
                            }
                          }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]">
                            <Download size={13} /> Download PDF
                          </button>
                          <div className="h-px bg-[var(--color-border)]" />
                          <button onClick={() => { handleDelete(invoice.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
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

      <AddInvoiceModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { loadData(); setAddModalOpen(false); }}
        clients={clients}
        projects={projects}
      />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-muted-foreground)]">Loading invoices...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}
