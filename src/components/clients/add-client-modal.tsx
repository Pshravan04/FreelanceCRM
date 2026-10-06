'use client';

import { useState } from 'react';
import { createClientRecord } from '@/lib/services/data';
import type { Client } from '@/lib/types';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (client: Client) => void;
}

export function AddClientModal({ open, onClose, onSuccess }: AddClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    status: 'ACTIVE' as const,
    notes: '',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    
    setLoading(true);
    try {
      const client = await createClientRecord({
        ...form,
        lead_id: null,
        is_active: true,
      });
      toast.success('Client created successfully');
      onSuccess(client);
      setForm({ name: '', company: '', email: '', phone: '', website: '', address: '', status: 'ACTIVE', notes: '' });
    } catch (err) {
      toast.error('Failed to create client');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-[var(--color-card)] border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold">Add New Client</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name *" required>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Doe" required className={inputClass} />
              </FormField>
              <FormField label="Company">
                <input type="text" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" className={inputClass} />
              </FormField>
              <FormField label="Email">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" className={inputClass} />
              </FormField>
              <FormField label="Phone">
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 8900" className={inputClass} />
              </FormField>
              <FormField label="Website">
                <input type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://example.com" className={inputClass} />
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </FormField>
            </div>
          </div>

          <FormField label="Address">
            <textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address..." rows={2} className={inputClass + ' resize-none'} />
          </FormField>

          <FormField label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Private notes about this client..." rows={3} className={inputClass + ' resize-none'} />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Client
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
