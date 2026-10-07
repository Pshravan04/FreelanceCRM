'use client';

import { useEffect, useState } from 'react';
import { getProject, deleteProject, getTasks, updateTask, deleteTask } from '@/lib/services/data';
import type { Project, Task } from '@/lib/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, CalendarClock, Briefcase, CheckCircle2, Circle, Clock, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { AddTaskModal } from '@/components/projects/add-task-modal';
import { cn } from '@/lib/utils';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [project, setProject] = useState<(Project & { client: any }) | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { id } = await params;
      try {
        const [projData, tasksData] = await Promise.all([
          getProject(id),
          getTasks({ project_id: id })
        ]);
        setProject(projData as any);
        setTasks(tasksData);
      } catch {
        toast.error('Failed to load project');
        router.push('/projects');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params, router]);

  const handleDelete = async () => {
    if (!project || !confirm('Delete this project?')) return;
    try {
      await deleteProject(project.id);
      toast.success('Project deleted');
      router.push('/projects');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleTaskStatusToggle = async (task: Task) => {
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

  if (loading) return <div className="p-6 animate-pulse"><div className="skeleton h-8 w-48 rounded" /></div>;
  if (!project) return null;

  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/projects" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-6 w-fit">
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{project.name}</h1>
          <Link href={`/clients/${project.client_id}`} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-2 mt-1 w-fit">
            <Briefcase size={14} /> {project.client?.name} {project.client?.company && `(${project.client.company})`}
          </Link>
          
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <span className={cn('status-badge', getStatusColor(project.status))}>
              {project.status.replace('_', ' ')}
            </span>
            <span className="status-badge bg-gray-100 text-gray-700">
              {project.priority} Priority
            </span>
            {project.budget > 0 && (
              <span className="text-sm font-semibold text-[var(--color-foreground)]">
                {formatCurrency(project.budget, 'INR')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={handleDelete}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Details & Progress */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Project Progress</h3>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--color-muted-foreground)]">{progress}% completed</span>
              <span className="font-medium">{completedTasks} / {tasks.length} tasks</span>
            </div>
            <div className="w-full bg-[var(--color-border)] rounded-full h-2">
              <div
                className="bg-[var(--color-foreground)] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-muted-foreground)]">Start Date</span>
                <span className="font-medium">{project.start_date ? formatDate(project.start_date) : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-muted-foreground)]">Deadline</span>
                <span className="font-medium text-[var(--color-foreground)] flex items-center gap-1.5">
                  <CalendarClock size={14} />
                  {project.deadline ? formatDate(project.deadline) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-muted-foreground)]">Budget</span>
                <span className="font-medium">{project.budget > 0 ? formatCurrency(project.budget, 'INR') : '—'}</span>
              </div>
            </div>
          </div>

          {project.description && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          )}
        </div>

        {/* Right column - Tasks */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <CheckSquare size={16} /> Tasks
              </h3>
              <button
                onClick={() => setAddTaskModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-foreground)] text-[var(--color-background)] text-xs font-medium rounded-md hover:opacity-90"
              >
                <Plus size={14} /> Add Task
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-[var(--color-border)] rounded-xl">
                <p className="text-sm text-[var(--color-muted-foreground)] mb-3">No tasks created yet.</p>
                <button onClick={() => setAddTaskModalOpen(true)} className="text-sm font-medium hover:underline">
                  Create your first task
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className={cn("group flex items-start gap-3 p-3 rounded-lg border transition-colors", task.status === 'DONE' ? "bg-[var(--color-muted)]/50 border-transparent" : "bg-[var(--color-background)] border-[var(--color-border)] hover:border-[var(--color-muted-foreground)]")}>
                    <button onClick={() => handleTaskStatusToggle(task)} className={cn("mt-0.5 transition-colors", task.status === 'DONE' ? "text-green-600" : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")}>
                      {task.status === 'DONE' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", task.status === 'DONE' && "text-[var(--color-muted-foreground)] line-through")}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {task.due_date && (
                          <span className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1">
                            <Clock size={12} /> {formatDate(task.due_date)}
                          </span>
                        )}
                        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", 
                          task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                          task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        )}>
                          {task.priority}
                        </span>
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
      </div>

      <AddTaskModal
        open={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        project={project}
        onSuccess={(task) => {
          setTasks(prev => [task, ...prev]);
          setAddTaskModalOpen(false);
        }}
      />
    </div>
  );
}
