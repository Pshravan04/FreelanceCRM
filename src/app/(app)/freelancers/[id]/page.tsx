'use client';

import { Suspense, useState, useEffect } from 'react';
import { getFreelancer, getTasks } from '@/lib/services/data';
import type { Freelancer, Task } from '@/lib/types';
import { toast } from 'sonner';
import { ArrowLeft, Edit2, MapPin, Mail, Phone, Briefcase, Globe, CheckSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn, formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';

function FreelancerDetailContent() {
  const params = useParams();
  const id = params.id as string;
  
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [freelancerData, tasksData] = await Promise.all([
          getFreelancer(id),
          getTasks({ search: '' }) // Ideally we want a filter by freelancer_id but the current getTasks doesn't support it directly without a small tweak. Wait, we can fetch all and filter in JS for now if needed, or if we modify getTasks to support it. Let's filter locally.
        ]);
        setFreelancer(freelancerData);
        setTasks(tasksData.filter(t => t.freelancer_id === id));
      } catch (err) {
        toast.error('Failed to load freelancer details');
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-foreground)] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!freelancer) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Freelancer not found</h2>
        <Link href="/freelancers" className="text-blue-500 hover:underline">Return to Freelancers</Link>
      </div>
    );
  }

  const AVAILABILITY_COLORS: Record<string, string> = {
    'Available': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Partially Available': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Busy': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Unavailable': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/freelancers" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
          <ArrowLeft size={16} />
          Back to Freelancers
        </Link>
        <button className="flex items-center gap-2 px-3 py-2 bg-[var(--color-muted)] text-[var(--color-foreground)] text-sm font-medium rounded-lg hover:bg-[var(--color-border)] transition-colors">
          <Edit2 size={16} />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-inner">
                {freelancer.full_name.charAt(0)}
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{freelancer.full_name}</h1>
              <p className="text-[var(--color-muted-foreground)] font-medium mt-1">{freelancer.freelancer_type || 'Freelancer'}</p>
              
              <div className={cn('mt-3 px-3 py-1 rounded-full text-xs font-bold border border-transparent', AVAILABILITY_COLORS[freelancer.availability] || 'bg-zinc-100 text-zinc-800')}>
                {freelancer.availability}
              </div>
            </div>

            <div className="mt-8 space-y-4 pt-6 border-t border-[var(--color-border)]">
              {freelancer.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-[var(--color-muted-foreground)]" />
                  <a href={`mailto:${freelancer.email}`} className="text-[var(--color-foreground)] hover:underline">{freelancer.email}</a>
                </div>
              )}
              {freelancer.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-[var(--color-muted-foreground)]" />
                  <a href={`tel:${freelancer.phone}`} className="text-[var(--color-foreground)] hover:underline">{freelancer.phone}</a>
                </div>
              )}
              {freelancer.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-[var(--color-muted-foreground)]" />
                  <span className="text-[var(--color-foreground)]">{freelancer.location}</span>
                </div>
              )}
              {freelancer.portfolio_url && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe size={16} className="text-[var(--color-muted-foreground)]" />
                  <a href={freelancer.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Portfolio</a>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-semibold mb-3">Rates</h3>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-muted-foreground)]">Hourly Rate</span>
                <span className="font-bold">${freelancer.hourly_rate}/hr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workload & Tasks */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills?.length > 0 ? (
                freelancer.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-[var(--color-muted)] text-sm font-medium rounded-full text-[var(--color-foreground)] border border-[var(--color-border)]">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[var(--color-muted-foreground)]">No skills listed.</span>
              )}
            </div>
          </div>

          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Assigned Tasks</h3>
              <div className="flex items-center gap-3">
                <span className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)] px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {tasks.length} tasks
                </span>
                <Link href={`/tasks?new=1&freelancer=${freelancer.id}`} className="text-xs font-medium text-[var(--color-foreground)] hover:underline">
                  + Assign Task
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.length > 0 ? tasks.map(task => (
                <div key={task.id} className="p-4 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)]/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/tasks?search=${encodeURIComponent(task.title)}`} className="font-semibold text-sm hover:underline">{task.title}</Link>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', getStatusColor(task.status))}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', getPriorityColor(task.priority))} />
                      <span className="text-[var(--color-muted-foreground)] capitalize">{task.priority.toLowerCase()}</span>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                        <Clock size={12} />
                        {formatDate(task.due_date)}
                      </div>
                    )}
                    {task.project?.name && (
                      <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                        <Briefcase size={12} />
                        {task.project.name}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center border border-dashed border-[var(--color-border)] rounded-xl">
                  <CheckSquare size={32} className="mx-auto text-[var(--color-muted-foreground)] mb-3" />
                  <h4 className="font-medium">No tasks assigned</h4>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">This freelancer has no tasks assigned to them currently.</p>
                </div>
              )}
            </div>
          </div>

          {freelancer.notes && (
             <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Notes</h3>
                <p className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-wrap">{freelancer.notes}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FreelancerDetailPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <FreelancerDetailContent />
    </Suspense>
  );
}
