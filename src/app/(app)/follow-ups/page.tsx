'use client';

import { useState, useEffect } from 'react';
import { getFollowUps, updateFollowUp, deleteFollowUp, getLeads, getClients } from '@/lib/services/data';
import type { FollowUp, Lead, Client } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Mail, Phone, Calendar, Users, ExternalLink } from 'lucide-react';
import { AddFollowUpModal } from '@/components/follow-ups/add-follow-up-modal';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ExtendedFollowUp = FollowUp & { lead?: { name: string }, client?: { name: string } };

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<ExtendedFollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('UPCOMING');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fuData, lData, cData] = await Promise.all([
        getFollowUps({ status: filter === 'ALL' ? undefined : filter }),
        getLeads({ status: 'NEW' }), // Might want to load all open leads
        getClients()
      ]);
      setFollowUps(fuData as any);
      setLeads(lData);
      setClients(cData);
    } catch {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleToggle = async (fu: ExtendedFollowUp) => {
    const newStatus = fu.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED';
    try {
      await updateFollowUp(fu.id, { status: newStatus });
      setFollowUps(prev => prev.map(f => f.id === fu.id ? { ...f, status: newStatus } : f));
      toast.success(newStatus === 'COMPLETED' ? 'Marked as completed' : 'Marked as upcoming');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this follow-up?')) return;
    try {
      await deleteFollowUp(id);
      setFollowUps(prev => prev.filter(f => f.id !== id));
      toast.success('Follow-up deleted');
    } catch {
      toast.error('Failed to delete follow-up');
    }
  };

  const getIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <Clock size={14} className="text-red-500" />;
      case 'HIGH': return <Clock size={14} className="text-orange-500" />;
      case 'LOW': return <Clock size={14} className="text-gray-500" />;
      default: return <Clock size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Follow-ups</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">Stay on top of your communications</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Schedule
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-[var(--color-border)]">
        <button onClick={() => setFilter('UPCOMING')} className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", filter === 'UPCOMING' ? "border-[var(--color-foreground)] text-[var(--color-foreground)]" : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")}>
          Upcoming
        </button>
        <button onClick={() => setFilter('COMPLETED')} className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", filter === 'COMPLETED' ? "border-[var(--color-foreground)] text-[var(--color-foreground)]" : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")}>
          Completed
        </button>
        <button onClick={() => setFilter('ALL')} className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", filter === 'ALL' ? "border-[var(--color-foreground)] text-[var(--color-foreground)]" : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")}>
          All
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}
          </div>
        ) : followUps.length === 0 ? (
          <div className="py-16 text-center">
            <Clock size={48} className="mx-auto text-[var(--color-muted-foreground)] opacity-50 mb-4" />
            <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-2">No follow-ups found</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6 max-w-xs mx-auto">
              {filter === 'UPCOMING' ? 'Your schedule is clear. Enjoy!' : 'Nothing here yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {followUps.map(fu => {
              const isOverdue = new Date(fu.due_at) < new Date() && fu.status === 'UPCOMING';
              return (
                <div key={fu.id} className={cn("group flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-[var(--color-muted)]/50 transition-colors", fu.status === 'COMPLETED' && "opacity-60")}>
                  <button onClick={() => handleToggle(fu)} className={cn("flex-shrink-0 transition-colors", fu.status === 'COMPLETED' ? "text-green-600" : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")}>
                    {fu.status === 'COMPLETED' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={cn("flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md border", 
                        fu.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                        fu.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        fu.priority === 'LOW' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      )}>
                        {getIcon(fu.priority)} {fu.priority}
                      </span>
                      <p className={cn("text-sm font-medium truncate", fu.status === 'COMPLETED' && "line-through")}>
                        {fu.title}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className={cn("text-xs flex items-center gap-1.5 font-medium", isOverdue ? "text-red-600" : "text-[var(--color-foreground)]")}>
                        <Clock size={13} /> {formatDate(fu.due_at, 'MMM dd, h:mm a')}
                      </div>
                      
                      <div className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1.5">
                        <Users size={13} />
                        {fu.lead ? (
                          <Link href={`/leads/${fu.lead_id}`} className="hover:text-[var(--color-foreground)] hover:underline flex items-center gap-1">
                            Lead: {fu.lead.name} <ExternalLink size={10} />
                          </Link>
                        ) : fu.client ? (
                          <Link href={`/clients/${fu.client_id}`} className="hover:text-[var(--color-foreground)] hover:underline flex items-center gap-1">
                            Client: {fu.client.name} <ExternalLink size={10} />
                          </Link>
                        ) : '—'}
                      </div>
                    </div>
                    
                    {fu.description && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-2 line-clamp-2">
                        {fu.description}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center gap-2 self-start sm:self-center ml-auto">
                    <button onClick={() => handleDelete(fu.id)} className="p-1.5 text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded-md transition-all sm:opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddFollowUpModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { loadData(); setAddModalOpen(false); }}
        leads={leads}
        clients={clients}
      />
    </div>
  );
}
