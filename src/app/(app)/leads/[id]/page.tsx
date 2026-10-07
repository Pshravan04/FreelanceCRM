'use client';

import { useEffect, useState } from 'react';
import { getLead, deleteLead, updateLead, convertLeadToClient, getActivities, getFollowUps, getNotes } from '@/lib/services/data';
import type { Lead, Activity, FollowUp, Note } from '@/lib/types';
import { formatCurrency, formatDate, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit2, Trash2, UserCheck, Plus, Clock, Globe,
  Mail, Phone, ExternalLink, Activity as ActivityIcon
} from 'lucide-react';
import Link from 'next/link';
import { AddLeadModal } from '@/components/leads/add-lead-modal';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { id } = await params;
      try {
        const [leadData, activitiesData, followUpsData, notesData] = await Promise.all([
          getLead(id),
          getActivities(id, 'lead'),
          getFollowUps({ lead_id: id }),
          getNotes({ lead_id: id }),
        ]);
        setLead(leadData);
        setActivities(activitiesData);
        setFollowUps(followUpsData);
        setNotes(notesData);
      } catch {
        toast.error('Failed to load lead');
        router.push('/leads');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params, router]);

  const handleDelete = async () => {
    if (!lead || !confirm('Delete this lead?')) return;
    try {
      await deleteLead(lead.id);
      toast.success('Lead deleted');
      router.push('/leads');
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const handleConvert = async () => {
    if (!lead || !confirm('Convert this lead to a client?')) return;
    setConverting(true);
    try {
      const client = await convertLeadToClient(lead.id);
      toast.success('Lead converted to client!');
      router.push(`/clients/${client.id}`);
    } catch {
      toast.error('Failed to convert lead');
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <div className="p-6 animate-pulse"><div className="skeleton h-8 w-48 rounded" /></div>;
  if (!lead) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/leads" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-6 w-fit">
        <ArrowLeft size={14} /> Back to Leads
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{lead.name}</h1>
          {lead.company && <p className="text-[var(--color-muted-foreground)] mt-0.5">{lead.company}</p>}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className={`status-badge ${getStatusColor(lead.status)}`}>{lead.status}</span>
            {lead.estimated_value > 0 && (
              <span className="text-sm font-semibold text-[var(--color-foreground)]">
                {formatCurrency(lead.estimated_value, 'INR')}
              </span>
            )}
            {lead.probability > 0 && (
              <span className="text-sm text-[var(--color-muted-foreground)]">{lead.probability}% probability</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={handleConvert}
            disabled={converting || lead.status === 'WON' || lead.status === 'LOST'}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium border border-green-200 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UserCheck size={14} />
            <span className="md:hidden">Convert</span>
            <span className="hidden md:inline">{converting ? 'Converting...' : 'Convert to Client'}</span>
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors"
          >
            <Edit2 size={14} /> <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Details */}
        <div className="space-y-4">
          {/* Contact info */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2.5">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  <Mail size={13} /> {lead.email}
                </a>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  <Phone size={13} /> {lead.phone}
                </a>
              )}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  <Globe size={13} /> {lead.website}
                </a>
              )}
              {lead.instagram && (
                <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  <Globe size={13} /> {lead.instagram}
                </a>
              )}
              {lead.linkedin && (
                <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  <Globe size={13} /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Lead details */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3">Lead Details</h3>
            <div className="space-y-2">
              <DetailRow label="Source" value={lead.source} />
              <DetailRow label="Service" value={lead.service || '—'} />
              <DetailRow label="Created" value={formatDate(lead.created_at)} />
              <DetailRow label="Last Updated" value={formatDate(lead.updated_at)} />
              {lead.next_follow_up && (
                <DetailRow label="Next Follow-up" value={formatDate(lead.next_follow_up, 'MMM dd, yyyy h:mm a')} />
              )}
            </div>
          </div>

          {lead.notes && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">{lead.notes}</p>
            </div>
          )}

          {/* Upcoming follow-ups */}
          {followUps.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock size={14} /> Follow-ups
              </h3>
              <div className="space-y-2">
                {followUps.slice(0, 3).map(fu => (
                  <div key={fu.id} className="text-sm">
                    <p className="font-medium text-[var(--color-foreground)]">{fu.title}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{formatDate(fu.due_at, 'MMM dd · h:mm a')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Activity timeline */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <ActivityIcon size={14} /> Activity Timeline
            </h3>
            {activities.length === 0 ? (
              <div className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">No activity yet</div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-foreground)] mt-1.5 flex-shrink-0" />
                      {i < activities.length - 1 && <div className="w-px flex-1 bg-[var(--color-border)] mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm text-[var(--color-foreground)]">{activity.description}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{formatRelativeTime(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-muted-foreground)]">{label}</span>
      <span className="font-medium text-[var(--color-foreground)]">{value}</span>
    </div>
  );
}
