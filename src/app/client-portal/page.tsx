'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Project, ClientUpdate, Milestone } from '@/lib/types';
import { FileText, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [updates, setUpdates] = useState<ClientUpdate[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // The RLS policy ensures we only get our own projects, updates, etc.
      const [projectsRes, updatesRes, milestonesRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('client_updates').select('*').eq('is_visible_to_client', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('milestones').select('*').in('status', ['Upcoming', 'In Progress']).order('due_date', { ascending: true }).limit(3)
      ]);

      if (projectsRes.data) setProjects(projectsRes.data as Project[]);
      if (updatesRes.data) setUpdates(updatesRes.data as ClientUpdate[]);
      if (milestonesRes.data) setMilestones(milestonesRes.data as Milestone[]);
      
      setLoading(false);
    }
    
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-foreground)] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const mainProject = projects[0];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Good morning 👋</h1>
        <p className="text-[var(--color-muted-foreground)] text-sm">Here is the latest on your projects.</p>
      </div>

      {mainProject ? (
        <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold mb-1">Your Active Project</p>
              <h2 className="text-xl font-bold">{mainProject.name}</h2>
            </div>
            <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
              {mainProject.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{mainProject.progress}% Complete</span>
              <span className="text-[var(--color-muted-foreground)]">Expected {mainProject.deadline ? new Date(mainProject.deadline).toLocaleDateString() : 'TBD'}</span>
            </div>
            <div className="w-full bg-[var(--color-border)] rounded-full h-2">
              <div 
                className="bg-[var(--color-foreground)] h-2 rounded-full transition-all" 
                style={{ width: `${mainProject.progress}%` }}
              />
            </div>
          </div>

          <Link href={`/client-portal/projects/${mainProject.id}`} className="flex items-center justify-center w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
            View Project Details
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-8 text-center text-[var(--color-muted-foreground)]">
          No active projects found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Updates */}
        <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Recent Updates</h3>
            <Link href="/client-portal/updates" className="text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">View all</Link>
          </div>
          
          <div className="space-y-4">
            {updates.length > 0 ? updates.map(update => (
              <div key={update.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{update.title}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    {new Date(update.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">No recent updates.</p>
            )}
          </div>
        </div>

        {/* Next Milestones */}
        <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4">Next Milestones</h3>
          
          <div className="space-y-4">
            {milestones.length > 0 ? milestones.map(milestone => (
              <div key={milestone.id} className="flex gap-3 items-start">
                <div className="mt-0.5">
                  {milestone.status === 'Completed' ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <Clock size={16} className="text-[var(--color-muted-foreground)]" />
                  )}
                </div>
                <div className="flex-1 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium">{milestone.title}</p>
                  {milestone.due_date && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                      Due: {new Date(milestone.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">No upcoming milestones.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
