'use client';

import { useState } from 'react';
import { createTask } from '@/lib/services/data';
import type { Task, Project } from '@/lib/types';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  project: Project;
}

export function AddTaskModal({ open, onClose, onSuccess, project }: AddTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'TODO' as const,
    priority: 'MEDIUM' as const,
    due_date: '',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    
    setLoading(true);
    try {
      const task = await createTask({
        ...form,
        project_id: project.id,
        client_id: project.client_id,
        freelancer_id: null,
        due_date: form.due_date || null,
        completed_at: null,
      });
      toast.success('Task created successfully');
      onSuccess(task);
      setForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', due_date: '' });
    } catch (err) {
      toast.error('Failed to create task');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--color-card)] md:rounded-xl rounded-t-2xl border-t md:border border-[var(--color-border)] shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up md:animate-fade-in pb-[env(safe-area-inset-bottom)]">
        {/* Mobile handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-card)] z-10">
          <div>
            <h2 className="text-base font-semibold">New Task</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">For {project.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4">
          <FormField label="Task Title *" required>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Design landing page" required className={inputClass} />
          </FormField>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <FormField label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </FormField>

            <FormField label="Priority">
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputClass}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </FormField>
          </div>

          <FormField label="Due Date">
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={inputClass} />
          </FormField>

          <FormField label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Task details..." rows={3} className={inputClass + ' resize-none'} />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Task
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
