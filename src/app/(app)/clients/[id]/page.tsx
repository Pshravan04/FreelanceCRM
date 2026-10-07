'use client';

import { useEffect, useState } from 'react';
import { getClient, deleteClient, getProjects, getInvoices, getPayments, getFollowUps } from '@/lib/services/data';
import type { Client, Project, Invoice, Payment, FollowUp } from '@/lib/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Edit2, Trash2, Mail, Phone, Globe, FolderKanban, FileText, CreditCard, Clock, MapPin, Building2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [enablingPortal, setEnablingPortal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { id } = await params;
      try {
        const [clientData, projData, invData, payData, fuData] = await Promise.all([
          getClient(id),
          getProjects({ client_id: id }),
          getInvoices({ client_id: id }),
          getPayments({ client_id: id }),
          getFollowUps({ client_id: id })
        ]);
        setClient(clientData);
        setProjects(projData);
        setInvoices(invData);
        setPayments(payData);
        setFollowUps(fuData);
      } catch {
        toast.error('Failed to load client');
        router.push('/clients');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params, router]);

  const handleDelete = async () => {
    if (!client || !confirm('Delete this client? This will delete all associated projects and invoices!')) return;
    try {
      await deleteClient(client.id);
      toast.success('Client deleted');
      router.push('/clients');
    } catch {
      toast.error('Failed to delete client');
    }
  };

  const handleEnablePortal = async () => {
    if (!client || !client.email) {
      toast.error('Client must have an email address to enable portal access');
      return;
    }
    
    setEnablingPortal(true);
    try {
      const res = await fetch('/api/clients/portal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, email: client.email, name: client.name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Portal access enabled. Invite sent to client.');
      setClient({ ...client, portal_access_email: client.email });
    } catch (err: any) {
      toast.error(err.message || 'Failed to enable portal access');
    } finally {
      setEnablingPortal(false);
    }
  };

  if (loading) return <div className="p-6 animate-pulse"><div className="skeleton h-8 w-48 rounded" /></div>;
  if (!client) return null;

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstandingInvoices = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE');
  const totalOutstanding = outstandingInvoices.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Link href="/clients" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] w-fit">
        <ArrowLeft size={14} /> Back to Clients
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{client.name}</h1>
          {client.company && (
            <p className="text-lg text-[var(--color-muted-foreground)] mt-1 flex items-center gap-2">
              <Building2 size={16} /> {client.company}
            </p>
          )}
          <div className="flex items-center gap-3 mt-4">
            <span className={cn('status-badge', 
              client.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
            )}>
              {client.is_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
            <span className="text-sm text-[var(--color-muted-foreground)]">Added {formatDate(client.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors">
            <Edit2 size={14} /> <span>Edit</span>
          </button>
          <button onClick={handleDelete} className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Col - Details & Stats */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="text-xs text-[var(--color-muted-foreground)] mb-1">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue, 'INR')}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-[var(--color-muted-foreground)] mb-1">Outstanding</p>
              <p className={cn("text-xl font-bold", totalOutstanding > 0 ? "text-yellow-600" : "text-[var(--color-foreground)]")}>
                {formatCurrency(totalOutstanding, 'INR')}
              </p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  <Mail size={14} /> {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  <Phone size={14} /> {client.phone}
                </a>
              )}
              {client.website && (
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  <Globe size={14} /> {client.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {client.address && (
                <div className="flex items-start gap-3 text-sm text-[var(--color-muted-foreground)]">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="whitespace-pre-wrap">{client.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Portal Access */}
          <div className="card p-5 border-blue-100 dark:border-blue-900/30">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Globe size={16} /> Client Portal Access
            </h3>
            {client.portal_access_email ? (
              <div>
                <p className="text-sm text-[var(--color-foreground)] mb-2">
                  Portal access is <span className="font-bold text-green-600">Active</span>
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
                  Account email: {client.portal_access_email}
                </p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/client-portal/login`);
                    toast.success('Portal link copied to clipboard');
                  }}
                  className="w-full px-3 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-[var(--color-foreground)] rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Copy Portal Link
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)] mb-3 leading-relaxed">
                  Enable the client portal to allow this client to securely view their projects, milestones, invoices, and updates.
                </p>
                <button 
                  onClick={handleEnablePortal}
                  disabled={enablingPortal}
                  className="w-full px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {enablingPortal ? 'Enabling...' : 'Enable Portal Access'}
                </button>
              </div>
            )}
          </div>

          {client.notes && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          {followUps.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock size={14} /> Follow-ups
              </h3>
              <div className="space-y-2">
                {followUps.slice(0, 3).map(fu => (
                  <div key={fu.id} className="text-sm">
                    <p className="font-medium text-[var(--color-foreground)]">{fu.title}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{formatDate(fu.due_at, 'MMM dd · h:mm a')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col - Projects & Invoices */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Projects */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <FolderKanban size={16} /> Projects ({projects.length})
              </h3>
              <Link href={`/projects?new=1&client=${client.id}`} className="text-xs font-medium text-[var(--color-foreground)] hover:underline">
                + New Project
              </Link>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6">No projects yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projects.map(p => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="block p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-muted-foreground)] transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', getStatusColor(p.status))}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                    {p.deadline && <p className="text-xs text-[var(--color-muted-foreground)]">Due: {formatDate(p.deadline)}</p>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <FileText size={16} /> Invoices ({invoices.length})
              </h3>
              <Link href={`/invoices?new=1&client=${client.id}`} className="text-xs font-medium text-[var(--color-foreground)] hover:underline">
                + Create Invoice
              </Link>
            </div>
            {invoices.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6">No invoices yet.</p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
                        <th className="pb-2 font-medium">Invoice</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Due</th>
                        <th className="pb-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/50 cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}`)}>
                          <td className="py-3 font-medium">{inv.invoice_number}</td>
                          <td className="py-3">
                            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusColor(inv.status))}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 text-[var(--color-muted-foreground)] text-xs">{formatDate(inv.due_date)}</td>
                          <td className="py-3 text-right font-medium">{formatCurrency(inv.total, inv.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Invoices List */}
                <div className="md:hidden flex flex-col space-y-3">
                  {invoices.map(inv => (
                    <div key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)} className="p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-muted-foreground)] transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm">{inv.invoice_number}</span>
                        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusColor(inv.status))}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[var(--color-muted-foreground)] text-xs">Due: {formatDate(inv.due_date)}</span>
                        <span className="font-semibold text-sm">{formatCurrency(inv.total, inv.currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Payments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <CreditCard size={16} /> Payments ({payments.length})
              </h3>
              <Link href={`/payments?new=1&client=${client.id}`} className="text-xs font-medium text-[var(--color-foreground)] hover:underline">
                + Record Payment
              </Link>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map(pay => (
                  <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)]">
                    <div>
                      <p className="text-sm font-medium">{formatDate(pay.payment_date)}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{pay.payment_method.replace('_', ' ')} {pay.reference ? `· ${pay.reference}` : ''}</p>
                    </div>
                    <span className="font-bold text-green-600">+{formatCurrency(pay.amount, 'INR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
