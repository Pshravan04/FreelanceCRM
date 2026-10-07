import { createClient } from '@/lib/supabase/client';
import type { Lead, Client, Project, Task, Invoice, InvoiceItem, Payment, FollowUp, Note, Activity } from '@/lib/types';

// ============================================
// LEADS
// ============================================

export async function getLeads(filters?: {
  status?: string;
  source?: string;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.source) query = query.eq('source', filters.source);
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Lead[];
}

export async function getLead(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Lead;
}

export async function createLead(lead: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('leads')
    .insert({ ...lead, user_id: user.id })
    .select()
    .single();
  if (error) throw error;

  // Create activity
  await createActivity({
    entity_type: 'lead',
    entity_id: data.id,
    action: 'created',
    description: `Created lead "${data.name}"`,
  });

  return data as Lead;
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Lead;
}

export async function deleteLead(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

export async function convertLeadToClient(leadId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const lead = await getLead(leadId);

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      lead_id: leadId,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
    })
    .select()
    .single();

  if (error) throw error;

  // Update lead status to WON
  await updateLead(leadId, { status: 'WON' });

  await createActivity({
    entity_type: 'lead',
    entity_id: leadId,
    action: 'converted',
    description: `Converted lead "${lead.name}" to client`,
    metadata: { client_id: client.id },
  });

  return client as Client;
}

// ============================================
// CLIENTS
// ============================================

export async function getClients(filters?: { search?: string; is_active?: boolean }) {
  const supabase = createClient();
  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Client[];
}

export async function getClient(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Client;
}

export async function createClientRecord(client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...client, user_id: user.id })
    .select()
    .single();
  if (error) throw error;

  await createActivity({
    entity_type: 'client',
    entity_id: data.id,
    action: 'created',
    description: `Created client "${data.name}"`,
  });

  return data as Client;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// PROJECTS
// ============================================

export async function getProjects(filters?: {
  status?: string;
  client_id?: string;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('projects')
    .select('*, client:clients(id, name, company)')
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.client_id) query = query.eq('client_id', filters.client_id);
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Project[];
}

export async function getProject(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:clients(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Project;
}

export async function createProject(project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client'>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, user_id: user.id })
    .select()
    .single();
  if (error) throw error;

  await createActivity({
    entity_type: 'project',
    entity_id: data.id,
    action: 'created',
    description: `Created project "${data.name}"`,
  });

  return data as Project;
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// TASKS
// ============================================

export async function getTasks(filters?: {
  status?: string;
  priority?: string;
  project_id?: string;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('tasks')
    .select('*, project:projects(id, name), client:clients(id, name)')
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.priority) query = query.eq('priority', filters.priority);
  if (filters?.project_id) query = query.eq('project_id', filters.project_id);
  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Task[];
}

export async function createTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'project' | 'client'>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...task, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const supabase = createClient();
  const payload = { ...updates };
  if (updates.status === 'DONE' && !updates.completed_at) {
    payload.completed_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// INVOICES
// ============================================

export async function getInvoices(filters?: {
  status?: string;
  client_id?: string;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('invoices')
    .select('*, client:clients(id, name, company), project:projects(id, name), invoice_items(*)')
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.client_id) query = query.eq('client_id', filters.client_id);
  if (filters?.search) {
    query = query.ilike('invoice_number', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Invoice[];
}

export async function getInvoice(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(*), project:projects(*), invoice_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Invoice;
}

export async function createInvoice(
  invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client' | 'project' | 'invoice_items'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[]
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: inv, error: invError } = await supabase
    .from('invoices')
    .insert({ ...invoice, user_id: user.id })
    .select()
    .single();
  if (invError) throw invError;

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(items.map((item) => ({ ...item, invoice_id: inv.id })));
    if (itemsError) throw itemsError;
  }

  await createActivity({
    entity_type: 'invoice',
    entity_id: inv.id,
    action: 'created',
    description: `Created invoice "${inv.invoice_number}"`,
  });

  return inv as Invoice;
}

export async function updateInvoice(
  id: string,
  updates: Partial<Invoice>,
  items?: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[]
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  if (items) {
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    if (items.length > 0) {
      await supabase.from('invoice_items').insert(items.map((item) => ({ ...item, invoice_id: id })));
    }
  }

  return data as Invoice;
}

export async function deleteInvoice(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// PAYMENTS
// ============================================

export async function getPayments(filters?: { client_id?: string; invoice_id?: string }) {
  const supabase = createClient();
  let query = supabase
    .from('payments')
    .select('*, client:clients(id, name), invoice:invoices(id, invoice_number)')
    .order('payment_date', { ascending: false });

  if (filters?.client_id) query = query.eq('client_id', filters.client_id);
  if (filters?.invoice_id) query = query.eq('invoice_id', filters.invoice_id);

  const { data, error } = await query;
  if (error) throw error;
  return data as Payment[];
}

export async function createPayment(payment: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'invoice' | 'client'>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('payments')
    .insert({ ...payment, user_id: user.id })
    .select()
    .single();
  if (error) throw error;

  // Auto-update invoice status if fully paid
  if (payment.invoice_id) {
    const invoice = await getInvoice(payment.invoice_id);
    const totalPaid = (await getPayments({ invoice_id: payment.invoice_id }))
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0) + payment.amount;

    if (totalPaid >= invoice.total) {
      await updateInvoice(payment.invoice_id, { status: 'PAID' });
    }
  }

  await createActivity({
    entity_type: 'payment',
    entity_id: data.id,
    action: 'created',
    description: `Recorded payment of ${payment.amount}`,
  });

  return data as Payment;
}

export async function deletePayment(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// FOLLOW-UPS
// ============================================

export async function getFollowUps(filters?: { status?: string; lead_id?: string; client_id?: string }) {
  const supabase = createClient();
  let query = supabase
    .from('follow_ups')
    .select('*, lead:leads(id, name), client:clients(id, name)')
    .order('due_at', { ascending: true });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id);
  if (filters?.client_id) query = query.eq('client_id', filters.client_id);

  const { data, error } = await query;
  if (error) throw error;
  return data as FollowUp[];
}

export async function createFollowUp(followUp: Omit<FollowUp, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'lead' | 'client'>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('follow_ups')
    .insert({ ...followUp, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as FollowUp;
}

export async function updateFollowUp(id: string, updates: Partial<FollowUp>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('follow_ups')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FollowUp;
}

export async function deleteFollowUp(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('follow_ups').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// NOTES
// ============================================

export async function getNotes(filters?: { lead_id?: string; client_id?: string; project_id?: string }) {
  const supabase = createClient();
  let query = supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id);
  if (filters?.client_id) query = query.eq('client_id', filters.client_id);
  if (filters?.project_id) query = query.eq('project_id', filters.project_id);

  const { data, error } = await query;
  if (error) throw error;
  return data as Note[];
}

export async function createNote(note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'lead' | 'client' | 'project'>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .insert({ ...note, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, updates: Partial<Note>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// ACTIVITIES
// ============================================

export async function getActivities(entityId?: string, entityType?: string) {
  const supabase = createClient();
  let query = supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (entityId) query = query.eq('entity_id', entityId);
  if (entityType) query = query.eq('entity_type', entityType);

  const { data, error } = await query;
  if (error) throw error;
  return data as Activity[];
}

export async function createActivity(activity: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'metadata'> & { metadata?: Record<string, any> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('activities').insert({
    ...activity,
    user_id: user.id,
    metadata: activity.metadata || {},
  });
}

// ============================================
// FREELANCERS
// ============================================

export async function getFreelancers(filters?: {
  availability?: string;
  search?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('freelancers')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.availability) query = query.eq('availability', filters.availability);
  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,freelancer_type.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any[]; // Using any to avoid type check issues if type isn't fully exported yet
}

export async function getFreelancer(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('freelancers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createFreelancer(freelancer: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('freelancers')
    .insert({ ...freelancer, user_id: user.id })
    .select()
    .single();
  if (error) throw error;

  await createActivity({
    entity_type: 'freelancer',
    entity_id: data.id,
    action: 'created',
    description: `Added freelancer "${data.full_name}"`,
  });

  return data;
}

export async function updateFreelancer(id: string, updates: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('freelancers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFreelancer(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('freelancers').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats() {
  const supabase = createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [
    leadsResult,
    clientsResult,
    projectsResult,
    invoicesResult,
    revenueResult,
    lastMonthRevenueResult,
  ] = await Promise.all([
    supabase.from('leads').select('status, created_at'),
    supabase.from('clients').select('is_active').eq('is_active', true),
    supabase.from('projects').select('status').in('status', ['PLANNING', 'IN_PROGRESS', 'REVIEW']),
    supabase.from('invoices').select('status, total, due_date'),
    supabase.from('payments').select('amount, payment_date').eq('status', 'COMPLETED').gte('payment_date', startOfMonth),
    supabase.from('payments').select('amount').eq('status', 'COMPLETED').gte('payment_date', startOfLastMonth).lte('payment_date', endOfLastMonth),
  ]);

  const leads = leadsResult.data || [];
  const newLeads = leads.filter(l => new Date(l.created_at) >= new Date(startOfMonth)).length;
  const activeClients = clientsResult.data?.length || 0;
  const activeProjects = projectsResult.data?.length || 0;
  const invoices = invoicesResult.data || [];
  const outstandingInvoices = invoices.filter(i => ['SENT', 'PENDING'].includes(i.status)).length;
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE' || (i.due_date && new Date(i.due_date) < now && !['PAID', 'CANCELLED'].includes(i.status))).length;
  const revenueThisMonth = (revenueResult.data || []).reduce((sum, p) => sum + p.amount, 0);
  const revenueLastMonth = (lastMonthRevenueResult.data || []).reduce((sum, p) => sum + p.amount, 0);
  const revenueChange = revenueLastMonth === 0 ? 0 : Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 * 10) / 10;
  const pendingPayments = invoices.filter(i => ['SENT', 'PENDING'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);

  return {
    totalLeads: leads.length,
    newLeads,
    activeClients,
    activeProjects,
    outstandingInvoices,
    overdueInvoices,
    revenueThisMonth,
    pendingPayments,
    revenueChange,
    leadsChange: 0,
  };
}

export async function getRevenueChartData(months = 6) {
  const supabase = createClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);

  const { data, error } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('status', 'COMPLETED')
    .gte('payment_date', startDate.toISOString())
    .order('payment_date', { ascending: true });

  if (error) throw error;

  const monthlyData: Record<string, number> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = 0;
  }

  (data || []).forEach((payment) => {
    const date = new Date(payment.payment_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[key] !== undefined) {
      monthlyData[key] += payment.amount;
    }
  });

  return Object.entries(monthlyData).map(([month, revenue]) => ({
    month,
    revenue,
    label: new Date(month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
  }));
}

// ============================================
// GLOBAL SEARCH
// ============================================

export async function globalSearch(query: string) {
  const supabase = createClient();
  const q = `%${query}%`;

  const [leads, clients, projects, tasks, invoices] = await Promise.all([
    supabase.from('leads').select('id, name, company, status').or(`name.ilike.${q},company.ilike.${q},email.ilike.${q}`).limit(5),
    supabase.from('clients').select('id, name, company').or(`name.ilike.${q},company.ilike.${q},email.ilike.${q}`).limit(5),
    supabase.from('projects').select('id, name, status').ilike('name', q).limit(5),
    supabase.from('tasks').select('id, title, status').ilike('title', q).limit(5),
    supabase.from('invoices').select('id, invoice_number, status').ilike('invoice_number', q).limit(5),
  ]);

  return {
    leads: leads.data || [],
    clients: clients.data || [],
    projects: projects.data || [],
    tasks: tasks.data || [],
    invoices: invoices.data || [],
  };
}
