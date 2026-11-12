// Types mirroring backend/app/models/*.py

export type UserRole = 'candidate' | 'recruiter' | 'admin'
export type JobStatus = 'draft' | 'published' | 'closed'
export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'rejected'
  | 'withdrawn'
  | 'hired'
export type DocumentType = 'cv' | 'diploma' | 'identity' | 'other'
export type DocumentStatus = 'uploaded' | 'processing' | 'verified' | 'inconsistent' | 'error'
export type AnalysisStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type AgentType =
  | 'job_requirement'
  | 'cv_extraction'
  | 'document_verification'
  | 'matching'
  | 'report'
export type AgentExecutionStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped'

export interface Job {
  id: string
  title: string
  company_name: string | null
  description: string
  location: string | null
  contract_type: string | null
  experience_min_years: number | null
  experience_max_years: number | null
  is_remote: boolean
  status: JobStatus
  published_at: string | null
  created_at: string
  skills: string[]
}

export interface Candidate {
  full_name: string
  email: string
  headline: string
  years_experience: number
}

export interface ApplicationDocument {
  id: string
  document_type: DocumentType
  status: DocumentStatus
  original_filename: string
  mime_type: string
  file_size_bytes: number
  page_count: number | null
}

export interface AgentExecution {
  agent_type: AgentType
  status: AgentExecutionStatus
  attempt_number: number
  provider: string | null
  model_name: string | null
  duration_ms: number | null
  input_tokens: number | null
  output_tokens: number | null
  summary: string | null
  error_message: string | null
}

export interface ScoreBreakdown {
  skills: number
  experience: number
  education: number
  documents: number
}

export interface AnalysisRun {
  id: string
  status: AnalysisStatus
  overall_score: number | null
  breakdown: ScoreBreakdown | null
  result_summary: string | null
  strengths: string[]
  gaps: string[]
  started_at: string | null
  completed_at: string | null
  executions: AgentExecution[]
}

export interface Application {
  id: string
  job_id: string
  candidate: Candidate
  status: ApplicationStatus
  cover_letter: string | null
  created_at: string
  documents: ApplicationDocument[]
  analysis: AnalysisRun | null
}

export type Page = 'dashboard' | 'jobs' | 'applications' | 'analyses'
