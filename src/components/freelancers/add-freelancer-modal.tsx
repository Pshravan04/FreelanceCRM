'use client';

import { useState } from 'react';
import { createFreelancer } from '@/lib/services/data';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { FreelancerAvailability } from '@/lib/types';

interface AddFreelancerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFreelancerModal({ open, onClose, onSuccess }: AddFreelancerModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const skillsString = formData.get('skills') as string;
    const skills = skillsString ? skillsString.split(',').map(s => s.trim()).filter(Boolean) : [];

    const freelancer = {
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      location: formData.get('location') as string || null,
      freelancer_type: formData.get('freelancer_type') as string || null,
      skills,
      hourly_rate: Number(formData.get('hourly_rate')) || 0,
      project_rate: Number(formData.get('project_rate')) || 0,
      availability: (formData.get('availability') as FreelancerAvailability) || 'Available',
      current_workload: Number(formData.get('current_workload')) || 0,
      notes: formData.get('notes') as string || null,
    };

    try {
      await createFreelancer(freelancer);
      toast.success('Freelancer added successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add freelancer');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div 
        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Add Freelancer</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Full Name *</label>
              <input required name="full_name" type="text" className="w-full px-3 py-2 border rounded-md" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input name="email" type="email" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input name="phone" type="text" className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role / Type</label>
                <input name="freelancer_type" type="text" placeholder="e.g. Video Editor" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input name="location" type="text" placeholder="City, Country" className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
              <input name="skills" type="text" placeholder="Premiere Pro, After Effects" className="w-full px-3 py-2 border rounded-md" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hourly Rate</label>
                <input name="hourly_rate" type="number" step="0.01" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Availability</label>
                <select name="availability" className="w-full px-3 py-2 border rounded-md">
                  <option value="Available">Available</option>
                  <option value="Partially Available">Partially Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea name="notes" rows={3} className="w-full px-3 py-2 border rounded-md"></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 mt-6 border-t">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Adding...' : 'Add Freelancer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
