'use client';

import { useState } from 'react';
import { createLead } from '@/lib/services/data';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import type { Lead, LeadStatus } from '@/lib/types';
import { LEAD_SOURCES, LEAD_STATUSES } from '@/lib/utils';

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (lead: Lead) => void;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal', NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost',
};

const SERVICES = [
  'Web Design', 'Web Development', 'Mobile App', 'Logo Design',
  'Brand Identity', 'SEO', 'Content Writing', 'Social Media',
  'Video Editing', 'Consulting', 'Other'
];

export function AddLeadModal({ open, onClose, onSuccess }: AddLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', website: '',
    instagram: '', linkedin: '', source: 'Website',
    service: '', estimated_value: 0, probability: 50,
    status: 'NEW' as LeadStatus, notes: '', next_follow_up: '',
    tags: [] as string[],
  });

  const set = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      const lead = await createLead({
        ...form,
        estimated_value: Number(form.estimated_value) || 0,
        probability: Number(form.probability) || 50,
        next_follow_up: form.next_follow_up || null,
      });
      toast.success('Lead created successfully');
      onSuccess(lead);
      // Reset form
      setForm({
        name: '', company: '', email: '', phone: '', website: '',
        instagram: '', linkedin: '', source: 'Website',
        service: '', estimated_value: 0, probability: 50,
        status: 'NEW', notes: '', next_follow_up: '', tags: [],
      });
    } catch (err) {
      toast.error('Failed to create lead');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--color-card)] md:rounded-xl rounded-t-2xl border-t md:border border-[var(--color-border)] shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up md:animate-fade-in pb-[env(safe-area-inset-bottom)]">
        {/* Mobile handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-card)] border-b border-[var(--color-border)] px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold">Add New Lead</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
          {/* Basic info */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <FormField label="Full Name *" required>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Smith" required className={inputClass} />
              </FormField>
              <FormField label="Company">
                <input type="text" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company Inc." className={inputClass} />
              </FormField>
              <FormField label="Email">
                <input type="email" inputMode="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" className={inputClass} />
              </FormField>
              <FormField label="Phone">
                <input type="tel" inputMode="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9999999999" className={inputClass} />
              </FormField>
              <FormField label="Website">
                <input type="url" inputMode="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://example.com" className={inputClass} />
              </FormField>
              <FormField label="Instagram">
                <input type="text" value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@handle" className={inputClass} />
              </FormField>
            </div>
          </div>

          {/* Lead info */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-3">Lead Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <FormField label="Source">
                <select value={form.source} onChange={e => set('source', e.target.value)} className={inputClass}>
                  {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Service Interested In">
                <select value={form.service} onChange={e => set('service', e.target.value)} className={inputClass}>
                  <option value="">Select service...</option>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Estimated Value (₹)">
                <input type="number" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="50000" min={0} className={inputClass} />
              </FormField>
              <FormField label="Probability (%)">
                <input type="number" value={form.probability} onChange={e => set('probability', e.target.value)} min={0} max={100} className={inputClass} />
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value as LeadStatus)} className={inputClass}>
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </FormField>
              <FormField label="Next Follow-up">
                <input type="datetime-local" value={form.next_follow_up} onChange={e => set('next_follow_up', e.target.value)} className={inputClass} />
              </FormField>
            </div>
          </div>

          {/* Notes */}
          <FormField label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes about this lead..." rows={3} className={inputClass + ' resize-none'} />
          </FormField>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Lead
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
