'use client';

import { useState } from 'react';
import { createPayment } from '@/lib/services/data';
import type { Payment, Invoice, Client } from '@/lib/types';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/utils';

interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
  invoices: Invoice[];
  clients: Client[];
  defaultInvoiceId?: string;
  defaultClientId?: string;
}

export function AddPaymentModal({ open, onClose, onSuccess, invoices, clients, defaultInvoiceId, defaultClientId }: AddPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoice_id: defaultInvoiceId || '',
    client_id: defaultClientId || '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER' as const,
    reference_number: '',
    notes: '',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  // Auto-fill amount and client if invoice is selected
  const handleInvoiceChange = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      setForm(prev => ({
        ...prev,
        invoice_id: id,
        client_id: inv.client_id || '',
        amount: String(inv.total),
      }));
    } else {
      set('invoice_id', id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) { toast.error('Client is required'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Valid amount is required'); return; }
    
    setLoading(true);
    try {
      const payment = await createPayment({
        ...form,
        amount: Number(form.amount),
        invoice_id: form.invoice_id || null,
        status: 'COMPLETED',
        payment_method: form.payment_method as any,
        reference: form.reference_number,
      });
      toast.success('Payment recorded successfully');
      onSuccess(payment);
    } catch (err) {
      toast.error('Failed to record payment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-0">
      <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--color-card)] md:rounded-xl rounded-t-2xl border-t md:border border-[var(--color-border)] shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up md:animate-fade-in pb-[env(safe-area-inset-bottom)]">
        {/* Mobile handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-card)] z-10">
          <h2 className="text-base font-semibold">Record Payment</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4">
          <FormField label="Client *" required>
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)} required className={inputClass} disabled={!!form.invoice_id}>
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>

          <FormField label="Invoice (Optional)">
            <select value={form.invoice_id} onChange={e => handleInvoiceChange(e.target.value)} className={inputClass}>
              <option value="">No Invoice / Advance Payment</option>
              {invoices
                .filter(i => !form.client_id || i.client_id === form.client_id)
                .map(i => <option key={i.id} value={i.id}>{i.invoice_number} (₹{i.total})</option>)}
            </select>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <FormField label="Amount (₹) *" required>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min={0.01} step="0.01" required className={inputClass} />
            </FormField>

            <FormField label="Payment Date *" required>
              <input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} required className={inputClass} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <FormField label="Payment Method *" required>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} required className={inputClass}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </FormField>

            <FormField label="Reference Number">
              <input type="text" value={form.reference_number} onChange={e => set('reference_number', e.target.value)} placeholder="Txn ID, Check #, etc." className={inputClass} />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Payment notes..." rows={2} className={inputClass + ' resize-none'} />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass = 'w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:border-transparent transition-all';

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
