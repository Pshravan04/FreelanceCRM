'use client';

import { useState } from 'react';
import { updateLead } from '@/lib/services/data';
import type { Lead, LeadStatus } from '@/lib/types';
import { cn, getStatusColor, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';

const COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'NEW', label: 'New', color: 'bg-blue-500' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-500' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'bg-purple-500' },
  { id: 'PROPOSAL', label: 'Proposal', color: 'bg-indigo-500' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'WON', label: 'Won', color: 'bg-green-500' },
  { id: 'LOST', label: 'Lost', color: 'bg-red-500' },
];

interface LeadKanbanProps {
  leads: Lead[];
  onUpdate: () => void;
}

export function LeadKanban({ leads: initialLeads, onUpdate }: LeadKanbanProps) {
  const [leads, setLeads] = useState(initialLeads);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId as LeadStatus;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    try {
      await updateLead(leadId, { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
    } catch {
      // Rollback
      setLeads(initialLeads);
      toast.error('Failed to update lead status');
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colLeads = leads.filter(l => l.status === col.id);
          const colValue = colLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

          return (
            <div key={col.id} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="text-sm font-medium">{col.label}</span>
                  <span className="text-xs text-[var(--color-muted-foreground)] bg-[var(--color-muted)] px-1.5 py-0.5 rounded-full">{colLeads.length}</span>
                </div>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {colValue > 0 ? `₹${(colValue / 1000).toFixed(0)}k` : ''}
                </span>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'min-h-32 rounded-xl p-2 space-y-2 transition-colors',
                      snapshot.isDraggingOver ? 'bg-[var(--color-muted)] ring-2 ring-[var(--color-border)]' : 'bg-[var(--color-muted)]/50'
                    )}
                  >
                    {colLeads.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              'card p-3 cursor-grab active:cursor-grabbing transition-shadow',
                              snapshot.isDragging && 'shadow-xl opacity-90'
                            )}
                          >
                            <Link href={`/leads/${lead.id}`} className="block" onClick={e => snapshot.isDragging && e.preventDefault()}>
                              <p className="text-sm font-medium text-[var(--color-foreground)] mb-1">{lead.name}</p>
                              {lead.company && <p className="text-xs text-[var(--color-muted-foreground)] mb-2">{lead.company}</p>}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--color-muted-foreground)]">{lead.source}</span>
                                {lead.estimated_value > 0 && (
                                  <span className="text-xs font-semibold text-[var(--color-foreground)]">
                                    ₹{(lead.estimated_value / 1000).toFixed(0)}k
                                  </span>
                                )}
                              </div>
                              {lead.probability > 0 && (
                                <div className="mt-2">
                                  <div className="w-full bg-[var(--color-border)] rounded-full h-1">
                                    <div
                                      className="bg-[var(--color-foreground)] h-1 rounded-full"
                                      style={{ width: `${lead.probability}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{lead.probability}% chance</p>
                                </div>
                              )}
                            </Link>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {colLeads.length === 0 && (
                      <div className="py-4 text-center text-xs text-[var(--color-muted-foreground)]">
                        Drop leads here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
