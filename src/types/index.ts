export type PipelineStage = 'lead' | 'discovery_call' | 'deal_in_meeting' | 'paid_deposit' | 'in_progress' | 'review' | 'completed_paid';
export type ServiceType = 'website_design' | 'website_redesign' | 'landing_page' | 'maintenance' | 'ecommerce';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue';
export type TeamRole = 'owner' | 'developer' | 'designer' | 'sales';

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  industry?: string;
  website_url?: string;
  source?: string;
  status: 'active' | 'inactive' | 'prospect';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  name: string;
  client_id?: string;
  service_type: ServiceType;
  status: 'pending' | 'in_progress' | 'waiting_review' | 'completed';
  budget?: number;
  cost?: number;
  deadline?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
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

export interface Invoice {
  id: string;
  client_name: string;
  amount: number;
  type: 'income' | 'expense';
  status: InvoiceStatus;
  description?: string;
  date: string;
  due_date?: string;
}

export interface Task {
  id: string;
  title: string;
  client_name?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  description: string;
  client_name?: string;
  duration: number;
  started_at: string;
  ended_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  joined_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'follow_up' | 'payment' | 'task' | 'info';
  read: boolean;
  created_at: string;
}
