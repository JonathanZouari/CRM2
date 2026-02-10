export interface User {
  user_id: string
  email: string
  full_name: string
  role: 'doctor' | 'secretary'
}

export interface Patient {
  id: string
  first_name: string
  last_name: string
  full_name: string
  id_number?: string
  phone: string
  email: string
  date_of_birth: string
  gender: string
  address: string
  created_at: string
}

export interface MedicalHistory {
  id: string
  patient_id: string
  diagnoses: string[]
  medications: string[]
  allergies: string[]
  notes: string
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration_minutes: number
  is_active: boolean
}

export interface Appointment {
  id: string
  patient_id: string
  service_id: string
  appointment_date: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes: string
  patient_name?: string
  service_name?: string
}

export interface Invoice {
  id: string
  patient_id: string
  service_id: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  issued_date: string
  paid_date: string | null
  patient_name?: string
  service_name?: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string
  position: number
  created_at: string
}

export interface DashboardKPIs {
  total_patients: number
  monthly_appointments: number
  monthly_revenue: number
  pending_count: number
  pending_total: number
  churn_patients: Array<{ patient_name: string; score: number }>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
