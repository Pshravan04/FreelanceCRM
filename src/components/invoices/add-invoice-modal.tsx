'use client';

import { useState } from 'react';
import { createInvoice } from '@/lib/services/data';
import type { Invoice, Client, Project } from '@/lib/types';
import { toast } from 'sonner';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { INVOICE_STATUSES } from '@/lib/utils';

interface AddInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
  clients: Client[];
  projects: Project[];
}

export function AddInvoiceModal({ open, onClose, onSuccess, clients, projects }: AddInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    invoice_number: `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    client_id: '',
    project_id: '',
    status: 'DRAFT' as const,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'INR',
    notes: '',
  });

  const [items, setItems] = useState([{ description: '', quantity: 1, rate: 0 }]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxRate = 0; // Configurable later
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) { toast.error('Client is required'); return; }
    if (items.some(i => !i.description.trim())) { toast.error('Item description is required'); return; }
    if (total <= 0) { toast.error('Total must be greater than 0'); return; }
    
    setLoading(true);
    try {
      const invoice = await createInvoice({
        ...form,
        project_id: form.project_id || null,
        subtotal,
        tax: taxAmount,
        total,
        discount: 0,
      }, items.map(item => ({
        ...item,
        amount: item.quantity * item.rate
      })));
      toast.success('Invoice created successfully');
      onSuccess(invoice);
    } catch (err) {
      toast.error('Failed to create invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-2xl max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex-shrink-0 bg-[var(--color-card)] border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-base font-semibold">Create Invoice</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Invoice Number *" required>
                <input type="text" value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} required className={inputClass} />
              </FormField>
              
              <FormField label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                  {INVOICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>

              <FormField label="Client *" required>
                <select value={form.client_id} onChange={e => set('client_id', e.target.value)} required className={inputClass}>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                </select>
              </FormField>

              <FormField label="Project (Optional)">
                <select value={form.project_id} onChange={e => set('project_id', e.target.value)} className={inputClass}>
                  <option value="">No Project</option>
                  {projects.filter(p => !form.client_id || p.client_id === form.client_id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Issue Date">
                <input type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} className={inputClass} required />
              </FormField>

              <FormField label="Due Date">
                <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={inputClass} required />
              </FormField>
            </div>

            {/* Line items */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Line Items</h3>
              <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-muted)]">
                    <tr>
                      <th className="text-left font-medium p-3">Description</th>
                      <th className="text-right font-medium p-3 w-24">Qty</th>
                      <th className="text-right font-medium p-3 w-32">Price</th>
                      <th className="text-right font-medium p-3 w-32">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="p-2">
                          <input type="text" value={item.description} onChange={e => {
                            const newItems = [...items];
                            newItems[index].description = e.target.value;
                            setItems(newItems);
                          }} placeholder="Service description" required className="w-full bg-transparent border-0 focus:ring-0 p-1 text-sm" />
                        </td>
                        <td className="p-2">
                          <input type="number" value={item.quantity} onChange={e => {
                            const newItems = [...items];
                            newItems[index].quantity = Number(e.target.value);
                            setItems(newItems);
                          }} min={1} required className="w-full bg-transparent border-0 focus:ring-0 p-1 text-sm text-right" />
                        </td>
                        <td className="p-2">
                          <input type="number" value={item.rate} onChange={e => {
                            const newItems = [...items];
                            newItems[index].rate = Number(e.target.value);
                            setItems(newItems);
                          }} min={0} required className="w-full bg-transparent border-0 focus:ring-0 p-1 text-sm text-right" />
                        </td>
                        <td className="p-3 text-right font-medium">
                          {(item.quantity * item.rate).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} disabled={items.length === 1} className="p-1.5 text-[var(--color-muted-foreground)] hover:text-red-500 disabled:opacity-30 rounded-md">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-2 border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
                  <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, rate: 0 }])} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-foreground)] hover:opacity-70 px-2 py-1">
                    <Plus size={12} /> Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-[var(--color-muted-foreground)]">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-muted-foreground)]">
                  <span>Tax (0%)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--color-border)] text-[var(--color-foreground)]">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <FormField label="Notes / Terms">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Thank you for your business!" rows={3} className={inputClass + ' resize-none'} />
            </FormField>

          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-[var(--color-card)] border-t border-[var(--color-border)] px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl z-10">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" form="invoice-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Save Invoice
          </button>
        </div>
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
