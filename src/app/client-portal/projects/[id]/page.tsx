'use client';

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Project, Milestone, CRMFile, Invoice } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, File as FileIcon, Download, Receipt } from 'lucide-react';
import { useParams } from 'next/navigation';

function ClientProjectDetailContent() {
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [files, setFiles] = useState<CRMFile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      const [projectRes, milestonesRes, filesRes, invoicesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('milestones').select('*').eq('project_id', id).order('order', { ascending: true }),
        supabase.from('files').select('*').eq('project_id', id).eq('is_client_visible', true).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('project_id', id).order('created_at', { ascending: false })
      ]);

      if (projectRes.data) setProject(projectRes.data as Project);
      if (milestonesRes.data) setMilestones(milestonesRes.data as Milestone[]);
      if (filesRes.data) setFiles(filesRes.data as CRMFile[]);
      if (invoicesRes.data) setInvoices(invoicesRes.data as Invoice[]);
      
      setLoading(false);
    }
    
    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-foreground)] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Project not found</h2>
        <Link href="/client-portal/projects" className="text-blue-500 hover:underline">Return to Projects</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/client-portal/projects" className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors w-fit">
        <ArrowLeft size={16} />
        Back to Projects
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{project.name}</h1>
          <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            {project.status.replace('_', ' ')}
          </span>
        </div>
        {project.description && (
          <p className="text-sm text-[var(--color-muted-foreground)]">{project.description}</p>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between text-sm font-bold">
          <span>Overall Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-[var(--color-border)] rounded-full h-2">
          <div 
            className="bg-[var(--color-foreground)] h-2 rounded-full transition-all" 
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Milestones */}
        <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4">Milestones</h3>
          <div className="space-y-4">
            {milestones.length > 0 ? milestones.map((milestone) => (
              <div key={milestone.id} className="flex gap-3 items-start">
                <div className="mt-0.5">
                  {milestone.status === 'Completed' ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <Clock size={16} className="text-[var(--color-muted-foreground)]" />
                  )}
                </div>
                <div className="flex-1 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                  <p className={milestone.status === 'Completed' ? "text-sm font-medium line-through text-[var(--color-muted-foreground)]" : "text-sm font-medium"}>
                    {milestone.title}
                  </p>
                  {milestone.due_date && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                      Due: {new Date(milestone.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">No milestones defined yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Deliverables / Files */}
          <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold mb-4">Deliverables & Files</h3>
            <div className="space-y-3">
              {files.length > 0 ? files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-muted)]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[var(--color-muted)] flex items-center justify-center">
                      <FileIcon size={14} className="text-[var(--color-foreground)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      {file.file_size && <p className="text-xs text-[var(--color-muted-foreground)]">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>}
                    </div>
                  </div>
                  <a href={file.file_path} target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)] rounded-lg transition-colors">
                    <Download size={16} />
                  </a>
                </div>
              )) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">No files shared yet.</p>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold mb-4">Invoices</h3>
            <div className="space-y-3">
              {invoices.length > 0 ? invoices.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Receipt size={16} className="text-[var(--color-muted-foreground)]" />
                    <div>
                      <p className="text-sm font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs font-bold mt-0.5">${invoice.total}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    invoice.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' :
                    invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">No invoices for this project.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientProjectDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-muted-foreground)]">Loading...</div>}>
      <ClientProjectDetailContent />
    </Suspense>
  );
}
