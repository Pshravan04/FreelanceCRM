'use client';

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Invoice, Project } from '@/lib/types';
import { Receipt, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

function ClientInvoicesContent() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<(Invoice & { project?: Project })[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      const { data } = await supabase
        .from('invoices')
        .select('*, project:projects(id, name)')
        .order('created_at', { ascending: false });
      
      if (data) setInvoices(data as any);
      setLoading(false);
    }
    loadInvoices();
  }, []);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-foreground)] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'DRAFT': return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Invoices</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">View and download your billing history.</p>
      </div>

      <div className="space-y-4">
        {invoices.length > 0 ? invoices.map(invoice => (
          <div key={invoice.id} className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-muted)] flex items-center justify-center shrink-0">
                  <Receipt size={24} className="text-[var(--color-foreground)]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{invoice.invoice_number}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', getStatusColor(invoice.status))}>
                      {invoice.status}
                    </span>
                    {invoice.project && (
                      <span className="text-xs text-[var(--color-muted-foreground)]">• {invoice.project.name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-2xl font-bold">${invoice.total}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  Issued: {new Date(invoice.issue_date).toLocaleDateString()}
                  {invoice.due_date && ` • Due: ${new Date(invoice.due_date).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-muted)] hover:bg-[var(--color-border)] text-sm font-medium rounded-lg transition-colors">
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </div>
        )) : (
          <div className="bg-white dark:bg-zinc-900 border border-[var(--color-border)] rounded-2xl p-12 text-center">
            <Receipt size={32} className="mx-auto text-[var(--color-muted-foreground)] mb-4 opacity-50" />
            <h3 className="font-medium text-lg">No invoices</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">You don't have any invoices yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientInvoicesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-muted-foreground)]">Loading...</div>}>
      <ClientInvoicesContent />
    </Suspense>
  );
}
