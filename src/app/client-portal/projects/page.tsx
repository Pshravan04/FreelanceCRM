'use client';

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

function ClientProjectsContent() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setProjects(data as Project[]);
      setLoading(false);
    }
    loadProjects();
  }, []);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-foreground)] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Your Projects</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Track the status of all your ongoing and completed projects.</p>
      </div>

      <div className="space-y-4">
        {projects.length > 0 ? projects.map(project => (
          <Link key={project.id} href={`/client-portal/projects/${project.id}`} className="block">
            <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm hover:border-[var(--color-foreground)] transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg">{project.name}</h3>
                <ChevronRight size={20} className="text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] transition-colors" />
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  {project.status.replace('_', ' ')}
                </span>
                {project.deadline && (
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    Expected: {new Date(project.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-[var(--color-border)] rounded-full h-1.5">
                  <div 
                    className="bg-[var(--color-foreground)] h-1.5 rounded-full transition-all" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </Link>
        )) : (
          <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-8 text-center text-[var(--color-muted-foreground)]">
            No projects found.
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientProjectsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-muted-foreground)]">Loading...</div>}>
      <ClientProjectsContent />
    </Suspense>
  );
}
