'use client';

import { Suspense, useState, useEffect } from 'react';
import { getProjects, deleteProject, updateProject, getClients } from '@/lib/services/data';
import type { Project, Client } from '@/lib/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, Trash2, Edit2, ExternalLink, CalendarClock, Briefcase, LayoutGrid, List } from 'lucide-react';
import { AddProjectModal } from '@/components/projects/add-project-modal';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function ProjectsContent() {
  const [projects, setProjects] = useState<(Project & { client: { name: string, company: string | null } })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new')) setAddModalOpen(true);
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projData, clientData] = await Promise.all([
        getProjects({
          status: statusFilter ? (statusFilter as any) : undefined,
          search: debouncedSearch || undefined,
        }),
        getClients()
      ]);
      setProjects(projData as any);
      setClients(clientData);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleStatusChange = async (id: string, status: any) => {
    try {
      await updateProject(id, { status });
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Projects</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {projects.length} active projects
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden flex-shrink-0">
            <button onClick={() => setView('grid')} className={cn('p-2 transition-colors', view === 'grid' ? 'bg-[var(--color-foreground)] text-[var(--color-background)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]')}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView('list')} className={cn('p-2 transition-colors', view === 'list' ? 'bg-[var(--color-foreground)] text-[var(--color-background)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]')}>
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card p-5 h-40 skeleton rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState onAdd={() => setAddModalOpen(true)} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="card p-5 hover:border-[var(--color-muted-foreground)] transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('text-xs font-medium px-2 py-1 rounded-full border', getStatusColor(project.status))}>
                  {project.status.replace('_', ' ')}
                </div>
                <button 
                  onClick={e => { e.preventDefault(); handleDelete(project.id); }} 
                  className="text-[var(--color-muted-foreground)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="font-bold text-[var(--color-foreground)] mb-1 truncate">{project.name}</h3>
              <p className="text-sm text-[var(--color-muted-foreground)] flex items-center gap-1.5 mb-4 truncate">
                <Briefcase size={13} /> {project.client?.name}
              </p>
              
              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
                <div className="flex items-center gap-1.5">
                  <CalendarClock size={13} />
                  {project.deadline ? formatDate(project.deadline) : 'No deadline'}
                </div>
                {project.budget > 0 && (
                  <span className="font-medium text-[var(--color-foreground)]">
                    {formatCurrency(project.budget, 'INR')}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden pb-16 md:pb-0">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Project</th>
                  <th className="text-left">Client</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Deadline</th>
                  <th className="text-right">Budget</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="cursor-pointer" onClick={() => router.push(`/projects/${project.id}`)}>
                    <td className="font-medium text-[var(--color-foreground)]">{project.name}</td>
                    <td className="text-[var(--color-muted-foreground)]">{project.client?.name}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        value={project.status}
                        onChange={(e) => handleStatusChange(project.id, e.target.value)}
                        className={cn('text-xs font-medium px-2 py-1 rounded-md border cursor-pointer focus:outline-none', getStatusColor(project.status))}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                    <td className="text-[var(--color-muted-foreground)] text-xs">
                      {project.deadline ? formatDate(project.deadline) : '—'}
                    </td>
                    <td className="text-right font-medium">
                      {project.budget > 0 ? formatCurrency(project.budget, 'INR') : '—'}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="relative">
                        <button onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)} className="p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenuId === project.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 overflow-hidden animate-fade-in">
                            <Link href={`/projects/${project.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]" onClick={() => setOpenMenuId(null)}>
                              <ExternalLink size={13} /> View
                            </Link>
                            <button onClick={() => { handleDelete(project.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
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

          {/* Mobile Card List */}
          <div className="md:hidden flex flex-col divide-y divide-[var(--color-border)]">
            {projects.map((project) => (
              <div key={project.id} onClick={() => router.push(`/projects/${project.id}`)} className="p-4 active:bg-[var(--color-muted)] transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-base text-[var(--color-foreground)]">{project.name}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{project.client?.name}</span>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap', getStatusColor(project.status))}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-3 text-xs text-[var(--color-muted-foreground)]">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock size={13} />
                    {project.deadline ? formatDate(project.deadline) : 'No deadline'}
                  </div>
                  {project.budget > 0 && (
                    <span className="font-medium text-sm text-[var(--color-foreground)]">
                      {formatCurrency(project.budget, 'INR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddProjectModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { loadData(); setAddModalOpen(false); }}
        clients={clients}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-muted-foreground)]">Loading projects...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl mb-4">🚀</div>
      <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-2">No projects yet</h3>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6 max-w-xs mx-auto">
        Create your first project to start tracking work, tasks, and deadlines.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90"
      >
        <Plus size={16} />
        New Project
      </button>
    </div>
  );
}
