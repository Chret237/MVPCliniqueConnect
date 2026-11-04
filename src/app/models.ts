export type Section = 'dashboard' | 'patients' | 'planning' | 'admissions' | 'billing' | 'support';

export interface Patient {
  id: string;
  reference: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  status: 'active' | 'merged';
}

export interface Appointment {
  id: string;
  patient: { id: string; first_name: string; last_name: string; reference: string };
  professional: { id: string; first_name: string; last_name: string; specialty: string };
  start_at: string;
  reason: string;
  status: 'planned' | 'confirmed' | 'arrived' | 'in_consultation' | 'done' | 'cancelled' | 'no_show';
  queue_number?: number;
}

export interface DashboardData {
  appointmentsToday: number;
  arrivals: number;
  waiting: number;
  pendingTasks: number;
}

export interface Paginated<T> {
  count: number;
  results: T[];
}
