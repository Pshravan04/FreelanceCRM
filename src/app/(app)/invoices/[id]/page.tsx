'use client';

import { useEffect, useState } from 'react';
import { getInvoice, deleteInvoice } from '@/lib/services/data';
import type { Invoice } from '@/lib/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Download, Printer, Send, CreditCard, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AddPaymentModal } from '@/components/payments/add-payment-modal';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [invoice, setInvoice] = useState<(Invoice & { client: any, project: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { id } = await params;
      try {
        const data = await getInvoice(id);
        setInvoice(data as any);
      } catch {
        toast.error('Failed to load invoice');
        router.push('/invoices');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params, router]);

  const handleDelete = async () => {
    if (!invoice || !confirm('Delete this invoice?')) return;
    try {
      await deleteInvoice(invoice.id);
      toast.success('Invoice deleted');
      router.push('/invoices');
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  if (loading) return <div className="p-6 animate-pulse"><div className="skeleton h-8 w-48 rounded" /></div>;
  if (!invoice) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/invoices" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] w-fit">
        <ArrowLeft size={14} /> Back to Invoices
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{invoice.invoice_number}</h1>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', getStatusColor(invoice.status))}>
            {invoice.status}
          </span>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {invoice.status !== 'PAID' && (
            <button 
              onClick={() => setPaymentModalOpen(true)}
              className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <CreditCard size={14} /> <span className="hidden sm:inline">Record Payment</span><span className="sm:hidden">Pay</span>
            </button>
          )}
          <button className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 border border-[var(--color-border)] text-sm font-medium rounded-lg hover:bg-[var(--color-muted)] transition-colors">
            <Send size={14} /> <span>Send</span>
          </button>
          <button 
            onClick={async () => {
              try {
                const { generateInvoicePDF } = await import('@/lib/pdf');
                if (invoice && invoice.client && invoice.invoice_items) {
                  generateInvoicePDF(invoice, invoice.client, invoice.invoice_items);
                  toast.success('PDF downloaded');
                }
              } catch (e) {
                toast.error('Failed to generate PDF');
                console.error(e);
              }
            }}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 border border-[var(--color-border)] text-sm font-medium rounded-lg hover:bg-[var(--color-muted)] transition-colors"
          >
            <Download size={14} /> <span>PDF</span>
          </button>
          <button onClick={handleDelete} className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="card bg-white dark:bg-zinc-950 p-8 sm:p-12 overflow-x-auto shadow-sm">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-foreground)] mb-1">INVOICE</h2>
            <p className="text-[var(--color-muted-foreground)]">{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-bold text-xl ml-auto mb-3">
              F
            </div>
            <p className="font-medium text-[var(--color-foreground)]">FreelanceCRM</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">contact@freelancecrm.com</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">Billed To</p>
            <p className="font-bold text-[var(--color-foreground)]">{invoice.client?.name}</p>
            {invoice.client?.company && <p className="text-sm text-[var(--color-muted-foreground)]">{invoice.client.company}</p>}
            {invoice.client?.address && <p className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-wrap mt-1">{invoice.client.address}</p>}
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Issue Date</p>
              <p className="font-medium text-[var(--color-foreground)]">{formatDate(invoice.issue_date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Due Date</p>
              <p className="font-medium text-[var(--color-foreground)]">{formatDate(invoice.due_date)}</p>
            </div>
          </div>
        </div>

        {invoice.project && (
          <div className="mb-8 p-3 bg-[var(--color-muted)]/50 rounded-lg flex items-center justify-between text-sm">
            <span className="text-[var(--color-muted-foreground)]">Project: <span className="font-medium text-[var(--color-foreground)]">{invoice.project.title}</span></span>
            <Link href={`/projects/${invoice.project_id}`} className="text-[var(--color-foreground)] hover:underline flex items-center gap-1">
              View Project <ExternalLink size={12} />
            </Link>
          </div>
        )}

        <div className="hidden md:block">
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] text-left">
                <th className="py-3 text-sm font-semibold text-[var(--color-muted-foreground)]">Description</th>
                <th className="py-3 text-sm font-semibold text-[var(--color-muted-foreground)] text-right w-24">Qty</th>
                <th className="py-3 text-sm font-semibold text-[var(--color-muted-foreground)] text-right w-32">Price</th>
                <th className="py-3 text-sm font-semibold text-[var(--color-muted-foreground)] text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {invoice.invoice_items?.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="py-4 text-sm text-[var(--color-foreground)]">{item.description}</td>
                  <td className="py-4 text-sm text-[var(--color-muted-foreground)] text-right">{item.quantity}</td>
                  <td className="py-4 text-sm text-[var(--color-muted-foreground)] text-right">{formatCurrency(item.rate, invoice.currency)}</td>
                  <td className="py-4 text-sm font-medium text-[var(--color-foreground)] text-right">{formatCurrency(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex flex-col gap-4 mb-8">
          <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">Items</h3>
          {invoice.invoice_items?.map((item: any, i: number) => (
            <div key={i} className="border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
              <p className="font-medium text-sm text-[var(--color-foreground)] mb-2">{item.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-muted-foreground)]">{item.quantity} × {formatCurrency(item.rate, invoice.currency)}</span>
                <span className="font-medium text-[var(--color-foreground)]">{formatCurrency(item.amount, invoice.currency)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Subtotal</span>
              <span className="font-medium text-[var(--color-foreground)]">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-muted-foreground)]">Tax</span>
                <span className="font-medium text-[var(--color-foreground)]">{formatCurrency(invoice.tax, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t-2 border-[var(--color-border)] pt-3 mt-3">
              <span className="font-bold text-[var(--color-foreground)]">Total Due</span>
              <span className="text-xl font-black text-[var(--color-foreground)]">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="border-t border-[var(--color-border)] pt-8">
            <h3 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">Notes / Terms</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>

      <AddPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          setPaymentModalOpen(false);
          // Optimistically reload the invoice page
          window.location.reload(); 
        }}
        invoices={[invoice]}
        clients={invoice.client ? [invoice.client] : []}
        defaultInvoiceId={invoice.id}
        defaultClientId={invoice.client_id || undefined}
      />
    </div>
  );
}
