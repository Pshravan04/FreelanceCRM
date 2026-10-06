'use client';

import { useState, useEffect } from 'react';
import { getPayments, deletePayment, getClients, getInvoices } from '@/lib/services/data';
import type { Payment, Client, Invoice } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { Plus, Search, Trash2, CreditCard } from 'lucide-react';
import { AddPaymentModal } from '@/components/payments/add-payment-modal';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { client: { name: string }, invoice?: { invoice_number: string } })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  const debouncedSearch = useDebounce(search, 300);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payData, clientData, invData] = await Promise.all([
        getPayments(),
        getClients(),
        getInvoices({ status: 'SENT' }) // Only load unpaid/sent invoices for the modal
      ]);
      setPayments(payData as any);
      setClients(clientData);
      setInvoices(invData);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment? This will not update invoice status automatically.')) return;
    try {
      await deletePayment(id);
      setPayments(prev => prev.filter(p => p.id !== id));
      toast.success('Payment deleted');
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Payments</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {formatCurrency(totalCollected, 'INR')} collected total
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Record Payment
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payments, clients, or ref #..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-10 w-full rounded" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard size={48} className="mx-auto text-[var(--color-muted-foreground)] opacity-50 mb-4" />
            <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-2">No payments yet</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6 max-w-xs mx-auto">
              Record a payment when a client pays an invoice.
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90"
            >
              <Plus size={16} />
              Record Payment
            </button>
          </div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-left">Client</th>
                <th className="text-left">Invoice</th>
                <th className="text-left">Method</th>
                <th className="text-left">Ref #</th>
                <th className="text-right">Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className="hover:bg-[var(--color-muted)]/50 transition-colors">
                  <td className="font-medium text-[var(--color-foreground)]">{formatDate(payment.payment_date)}</td>
                  <td className="text-[var(--color-muted-foreground)]">{payment.client?.name}</td>
                  <td>
                    {payment.invoice ? (
                      <Link href={`/invoices/${payment.invoice_id}`} className="text-xs font-medium text-[var(--color-foreground)] hover:underline">
                        {payment.invoice.invoice_number}
                      </Link>
                    ) : (
                      <span className="text-xs text-[var(--color-muted-foreground)]">—</span>
                    )}
                  </td>
                  <td className="text-[var(--color-muted-foreground)] text-xs">{payment.payment_method.replace('_', ' ')}</td>
                  <td className="text-[var(--color-muted-foreground)] text-xs">{payment.reference || '—'}</td>
                  <td className="text-right font-semibold text-green-600">
                    +{formatCurrency(payment.amount, 'INR')}
                  </td>
                  <td className="text-center">
                    <button onClick={() => handleDelete(payment.id)} className="p-1.5 text-[var(--color-muted-foreground)] hover:text-red-500 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddPaymentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { loadData(); setAddModalOpen(false); }}
        clients={clients}
        invoices={invoices}
      />
    </div>
  );
}
