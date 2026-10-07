'use client';

import { Suspense, useState, useEffect } from 'react';
import { getFreelancers, deleteFreelancer } from '@/lib/services/data';
import type { Freelancer } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, Trash2, Edit2, ExternalLink, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AddFreelancerModal } from '@/components/freelancers/add-freelancer-modal';

function FreelancersContent() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();

  const loadFreelancers = async () => {
    setLoading(true);
    try {
      const data = await getFreelancers({
        availability: availabilityFilter || undefined,
        search: debouncedSearch || undefined,
      });
      setFreelancers(data as Freelancer[]);
    } catch {
      toast.error('Failed to load freelancers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFreelancers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, availabilityFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this freelancer? This cannot be undone.')) return;
    try {
      await deleteFreelancer(id);
      setFreelancers(prev => prev.filter(f => f.id !== id));
      toast.success('Freelancer deleted');
    } catch {
      toast.error('Failed to delete freelancer');
    }
  };

  const AVAILABILITY_LABELS = ['Available', 'Partially Available', 'Busy', 'Unavailable', 'On Leave', 'Inactive'];
  
  const getAvailabilityColor = (avail: string) => {
    switch (avail) {
      case 'Available': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Partially Available': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'Busy': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Unavailable': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Freelancers</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {freelancers.length} active resources
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Resource
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search freelancers..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          >
            <option value="">All Availability</option>
            {AVAILABILITY_LABELS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : freelancers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-4">👩‍💻</div>
            <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-2">No freelancers yet</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6 max-w-xs mx-auto">
              Add your first freelancer to start managing your talent network.
            </p>
            <button onClick={() => setAddModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90">
              <Plus size={16} /> Add Freelancer
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="text-left">Name & Role</th>
                    <th className="text-left">Availability</th>
                    <th className="text-left">Skills</th>
                    <th className="text-left">Rate</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {freelancers.map((freelancer) => (
                    <tr key={freelancer.id} className="cursor-pointer" onClick={() => router.push(`/freelancers/${freelancer.id}`)}>
                      <td onClick={e => e.stopPropagation()}>
                        <Link href={`/freelancers/${freelancer.id}`} className="font-semibold text-[var(--color-foreground)] hover:underline">
                          {freelancer.full_name}
                        </Link>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{freelancer.freelancer_type || 'N/A'}</p>
                      </td>
                      <td>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', getAvailabilityColor(freelancer.availability))}>
                          {freelancer.availability}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {freelancer.skills?.slice(0, 3).map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 bg-[var(--color-muted)] text-[9px] rounded text-[var(--color-muted-foreground)] border border-[var(--color-border)]">
                              {skill}
                            </span>
                          ))}
                          {freelancer.skills?.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-[var(--color-muted)] text-[9px] rounded text-[var(--color-muted-foreground)] border border-[var(--color-border)]">
                              +{freelancer.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-sm font-medium">
                        ${freelancer.hourly_rate}/hr
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === freelancer.id ? null : freelancer.id)}
                            className="p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {openMenuId === freelancer.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 overflow-hidden animate-fade-in">
                              <Link href={`/freelancers/${freelancer.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => setOpenMenuId(null)}>
                                <ExternalLink size={13} /> View Profile
                              </Link>
                              <button onClick={() => handleDelete(freelancer.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col divide-y divide-[var(--color-border)]">
              {freelancers.map((freelancer) => (
                <div key={freelancer.id} onClick={() => router.push(`/freelancers/${freelancer.id}`)} className="p-4 active:bg-[var(--color-muted)] transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-base text-[var(--color-foreground)]">{freelancer.full_name}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{freelancer.freelancer_type}</span>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', getAvailabilityColor(freelancer.availability))}>
                      {freelancer.availability}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                    <MapPin size={10} />
                    {freelancer.location || 'Remote'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AddFreelancerModal 
        open={addModalOpen} 
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { loadFreelancers(); setAddModalOpen(false); }}
      />
    </div>
  );
}

export default function FreelancersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-muted-foreground)]">Loading...</div>}>
      <FreelancersContent />
    </Suspense>
  );
}
