'use client';

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ClientUpdate, Project } from '@/lib/types';
import { Bell } from 'lucide-react';

function ClientUpdatesContent() {
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<(ClientUpdate & { project?: Project })[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadUpdates() {
      setLoading(true);
      // Get all updates visible to this client
      const { data } = await supabase
        .from('client_updates')
        .select('*, project:projects(id, name)')
        .eq('is_visible_to_client', true)
        .order('created_at', { ascending: false });
      
      if (data) setUpdates(data as any);
      setLoading(false);
    }
    loadUpdates();
  }, []);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-foreground)] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Project Updates</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Latest news and status changes for your projects.</p>
      </div>

      <div className="space-y-4">
        {updates.length > 0 ? updates.map(update => (
          <div key={update.id} className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Bell size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-base">{update.title}</h3>
                  <span className="text-[10px] text-[var(--color-muted-foreground)]">
                    {new Date(update.created_at).toLocaleDateString()}
                  </span>
                </div>
                {update.project && (
                  <p className="text-xs font-medium text-blue-500 mb-2">Project: {update.project.name}</p>
                )}
                <div className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-wrap mt-2 bg-[var(--color-muted)]/30 p-4 rounded-xl border border-[var(--color-border)]">
                  {update.content}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-12 text-center">
            <Bell size={32} className="mx-auto text-[var(--color-muted-foreground)] mb-4 opacity-50" />
            <h3 className="font-medium text-lg">No updates yet</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Check back later for project news and milestones.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientUpdatesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-muted-foreground)]">Loading...</div>}>
      <ClientUpdatesContent />
    </Suspense>
  );
}
