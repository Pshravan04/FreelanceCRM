'use client';

import { useState, useEffect } from 'react';
import { getTasks, updateTask, deleteTask } from '@/lib/services/data';
import type { Task, Project } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { Search, Trash2, CheckCircle2, Circle, Clock, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ExtendedTask = Task & { project: { title: string } };

export default function TasksPage() {
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const debouncedSearch = useDebounce(search, 300);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks({
        status: statusFilter ? (statusFilter as any) : undefined,
        // The API might not support global search directly depending on how we wrote getTasks, 
        // but we'll do client-side filtering below if needed, or pass it to our API.
      });
      setTasks(data as any);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleTaskStatusToggle = async (task: ExtendedTask) => {
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await updateTask(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  // Client side search for tasks
  const filteredTasks = tasks.filter(t => 
    !debouncedSearch || 
    t.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    t.project?.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">My Tasks</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {filteredTasks.length} tasks found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or projects..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Completed</option>
        </select>
      </div>

      <div className="card p-5">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckSquare size={48} className="mx-auto text-[var(--color-muted-foreground)] opacity-50 mb-4" />
            <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-2">No tasks found</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6 max-w-xs mx-auto">
              You are all caught up! Create tasks from within your projects.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => (
              <div key={task.id} className={cn("group flex items-start gap-3 p-3.5 rounded-lg border transition-colors", task.status === 'DONE' ? "bg-[var(--color-muted)]/50 border-transparent" : "bg-[var(--color-background)] border-[var(--color-border)] hover:border-[var(--color-muted-foreground)]")}>
                <button onClick={() => handleTaskStatusToggle(task)} className={cn("mt-0.5 transition-colors", task.status === 'DONE' ? "text-green-600" : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")}>
                  {task.status === 'DONE' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={cn("text-sm font-medium", task.status === 'DONE' && "text-[var(--color-muted-foreground)] line-through")}>
                      {task.title}
                    </p>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", 
                      task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                      task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    )}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-2 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    {task.project && (
                      <Link href={`/projects/${task.project_id}`} className="text-xs text-[var(--color-foreground)] hover:underline font-medium">
                        {task.project.title}
                      </Link>
                    )}
                    {task.due_date && (
                      <span className={cn("text-xs flex items-center gap-1", 
                        new Date(task.due_date) < new Date() && task.status !== 'DONE' ? 'text-red-600 font-medium' : 'text-[var(--color-muted-foreground)]'
                      )}>
                        <Clock size={12} /> {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
