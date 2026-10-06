'use client';

import { useState } from 'react';
import { createProject } from '@/lib/services/data';
import type { Project, Client } from '@/lib/types';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import { PROJECT_STATUSES, PRIORITIES } from '@/lib/utils';

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  clients: Client[];
}

export function AddProjectModal({ open, onClose, onSuccess, clients }: AddProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    client_id: '',
    description: '',
    status: 'PLANNING' as const,
    priority: 'MEDIUM' as const,
    start_date: '',
    deadline: '',
    budget: 0,
  });

  const set = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.client_id) { toast.error('Client is required'); return; }
    
    setLoading(true);
    try {
      const { title, ...rest } = form;
      const project = await createProject({
        ...rest,
        name: title,
        budget: Number(form.budget) || 0,
        start_date: form.start_date || null,
        deadline: form.deadline || null,
        progress: 0,
        tags: [],
      });
      toast.success('Project created successfully');
      onSuccess(project);
      setForm({ title: '', client_id: '', description: '', status: 'PLANNING', priority: 'MEDIUM', start_date: '', deadline: '', budget: 0 });
    } catch (err) {
      toast.error('Failed to create project');
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
          <h2 className="text-base font-semibold">Create New Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Project Title *" required>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Website Redesign" required className={inputClass} />
            </FormField>
            
            <FormField label="Client *" required>
              <select value={form.client_id} onChange={e => set('client_id', e.target.value)} required className={inputClass}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
              </select>
            </FormField>

            <FormField label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </FormField>

            <FormField label="Priority">
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputClass}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>

            <FormField label="Start Date">
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputClass} />
            </FormField>

            <FormField label="Deadline">
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className={inputClass} />
            </FormField>
          </div>

          <FormField label="Budget (₹)">
            <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0" min={0} className={inputClass} />
          </FormField>

          <FormField label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Project scope and details..." rows={4} className={inputClass + ' resize-none'} />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Project
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
