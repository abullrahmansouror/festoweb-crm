export type ClientStatus = 'active' | 'inactive' | 'prospect';
export type ProjectStatus = 'pending' | 'in_progress' | 'waiting_review' | 'completed';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type PipelineStage =
  | 'lead'
  | 'discovery_call'
  | 'deal_in_meeting'
  | 'paid_deposit'
  | 'in_progress'
  | 'review'
  | 'completed_paid';

export type ServiceType =
  | 'website_design'
  | 'website_redesign'
  | 'landing_page'
  | 'maintenance'
  | 'ecommerce';

export interface Client {
  id: string;
  full_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  industry?: string;
  website_url?: string;
  notes?: string;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  service_type: ServiceType;
  status: ProjectStatus;
  deadline?: string;
  budget?: number;
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  due_date?: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface PipelineCard {
  id: string;
  client_name: string;
  company_name?: string;
  service_type: ServiceType;
  value?: number;
  stage: PipelineStage;
  notes?: string;
  next_follow_up?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'invoice' | 'project' | 'client' | 'renewal' | 'general';
  is_read: boolean;
  created_at: string;
}
