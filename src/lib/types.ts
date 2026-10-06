// src/lib/types.ts
// Core TypeScript types for the Freelancer CRM

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'UPI' | 'Bank Transfer' | 'Cash' | 'PayPal' | 'Stripe' | 'Cheque' | 'Other';
export type FollowUpStatus = 'UPCOMING' | 'COMPLETED' | 'SKIPPED';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  gstin: string | null;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  source: string;
  service: string | null;
  estimated_value: number;
  probability: number;
  status: LeadStatus;
  notes: string | null;
  next_follow_up: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  lead_id: string | null;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  total_revenue?: number;
  active_projects?: number;
  pending_invoices?: number;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  budget: number;
  start_date: string | null;
  deadline: string | null;
  status: ProjectStatus;
  progress: number;
  priority: Priority;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  project?: Project;
  client?: Client;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  project?: Project;
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string | null;
  client_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference: string | null;
  status: PaymentStatus;
  notes: string | null;
  created_at: string;
  // Relations
  invoice?: Invoice;
  client?: Client;
}

export interface FollowUp {
  id: string;
  user_id: string;
  lead_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  due_at: string;
  priority: Priority;
  status: FollowUpStatus;
  created_at: string;
  updated_at: string;
  // Relations
  lead?: Lead;
  client?: Client;
}

export interface Note {
  id: string;
  user_id: string;
  lead_id: string | null;
  client_id: string | null;
  project_id: string | null;
  title: string;
  content: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Relations
  lead?: Lead;
  client?: Client;
  project?: Project;
}

export interface CRMFile {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  invoice_id: string | null;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  // Relations
  client?: Client;
  project?: Project;
}

export interface Activity {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

// Dashboard stats
export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  activeClients: number;
  activeProjects: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  revenueThisMonth: number;
  pendingPayments: number;
  revenueChange: number;
  leadsChange: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface LeadPipelineData {
  status: LeadStatus;
  count: number;
  value: number;
}
