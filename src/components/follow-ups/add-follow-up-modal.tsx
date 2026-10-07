'use client';

import { useState } from 'react';
import { createFollowUp } from '@/lib/services/data';
import type { FollowUp, Lead, Client } from '@/lib/types';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import { FOLLOWUP_TYPES } from '@/lib/utils';

interface AddFollowUpModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (followUp: FollowUp) => void;
  leads: Lead[];
  clients: Client[];
}

export function AddFollowUpModal({ open, onClose, onSuccess, leads, clients }: AddFollowUpModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    priority: 'MEDIUM' as const,
    lead_id: '',
    client_id: '',
    due_at: '',
    notes: '',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.lead_id && !form.client_id) { toast.error('Lead or Client is required'); return; }
    if (!form.due_at) { toast.error('Due date is required'); return; }
    
    setLoading(true);
    try {
      const followUp = await createFollowUp({
        ...form,
        description: form.notes,
        lead_id: form.lead_id || null,
        client_id: form.client_id || null,
        status: 'UPCOMING',
      });
      toast.success('Follow-up scheduled');
      onSuccess(followUp);
      setForm({ title: '', priority: 'MEDIUM', lead_id: '', client_id: '', due_at: '', notes: '' });
    } catch (err) {
      toast.error('Failed to schedule follow-up');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-0">
      <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--color-card)] md:rounded-xl rounded-t-2xl border-t md:border border-[var(--color-border)] shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up md:animate-fade-in pb-[env(safe-area-inset-bottom)]">
        {/* Mobile handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-card)] z-10">
          <h2 className="text-base font-semibold">Schedule Follow-up</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4">
          <FormField label="Title *" required>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Send proposal..." required className={inputClass} />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <FormField label="Priority">
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputClass}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </FormField>

            <FormField label="Due Date & Time *" required>
              <input type="datetime-local" value={form.due_at} onChange={e => set('due_at', e.target.value)} required className={inputClass} />
            </FormField>
          </div>

          <FormField label="Related To (Choose one) *" required>
            <div className="space-y-2">
              <select value={form.lead_id} onChange={e => { set('lead_id', e.target.value); set('client_id', ''); }} className={inputClass}>
                <option value="">Select a Lead...</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name} {l.company ? `(${l.company})` : ''}</option>)}
              </select>
              <div className="text-center text-xs text-[var(--color-muted-foreground)]">OR</div>
              <select value={form.client_id} onChange={e => { set('client_id', e.target.value); set('lead_id', ''); }} className={inputClass}>
                <option value="">Select a Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
              </select>
            </div>
          </FormField>

          <FormField label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Talking points, context..." rows={3} className={inputClass + ' resize-none'} />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Schedule
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
