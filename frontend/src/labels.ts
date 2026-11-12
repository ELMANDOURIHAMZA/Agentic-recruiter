import type {
  AgentExecutionStatus,
  AgentType,
  AnalysisStatus,
  ApplicationStatus,
  DocumentStatus,
  DocumentType,
  JobStatus,
} from './types'

export type Tone = 'neutral' | 'info' | 'accent' | 'ok' | 'warn' | 'err'

export const JOB_STATUS: Record<JobStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Brouillon', tone: 'neutral' },
  published: { label: 'Publiée', tone: 'ok' },
  closed: { label: 'Fermée', tone: 'err' },
}

export const APP_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  submitted: { label: 'Soumise', tone: 'info' },
  under_review: { label: 'En revue', tone: 'accent' },
  shortlisted: { label: 'Présélectionnée', tone: 'ok' },
  rejected: { label: 'Refusée', tone: 'err' },
  withdrawn: { label: 'Retirée', tone: 'neutral' },
  hired: { label: 'Embauchée', tone: 'ok' },
}

export const DOC_TYPE: Record<DocumentType, string> = {
  cv: 'CV',
  diploma: 'Diplôme',
  identity: 'Identité',
  other: 'Autre',
}

export const DOC_STATUS: Record<DocumentStatus, { label: string; tone: Tone }> = {
  uploaded: { label: 'Téléversé', tone: 'neutral' },
  processing: { label: 'Traitement', tone: 'info' },
  verified: { label: 'Vérifié', tone: 'ok' },
  inconsistent: { label: 'Incohérent', tone: 'warn' },
  error: { label: 'Erreur', tone: 'err' },
}

export const ANALYSIS_STATUS: Record<AnalysisStatus, { label: string; tone: Tone }> = {
  queued: { label: 'En file', tone: 'neutral' },
  running: { label: 'En cours', tone: 'info' },
  completed: { label: 'Terminée', tone: 'ok' },
  failed: { label: 'Échec', tone: 'err' },
  cancelled: { label: 'Annulée', tone: 'neutral' },
}

export const EXEC_STATUS: Record<AgentExecutionStatus, { label: string; tone: Tone }> = {
  pending: { label: 'En attente', tone: 'neutral' },
  running: { label: 'En cours', tone: 'info' },
  succeeded: { label: 'Réussi', tone: 'ok' },
  failed: { label: 'Échec', tone: 'err' },
  skipped: { label: 'Ignoré', tone: 'neutral' },
}

export const AGENTS: { type: AgentType; name: string; role: string }[] = [
  { type: 'job_requirement', name: 'Exigences du poste', role: "Extrait compétences, niveau et critères de l'offre" },
  { type: 'cv_extraction', name: 'Extraction du CV', role: 'Structure expériences, formations et compétences' },
  { type: 'document_verification', name: 'Vérification documents', role: 'Contrôle la cohérence CV / diplôme / identité' },
  { type: 'matching', name: 'Matching', role: 'Compare le profil aux exigences et calcule le score' },
  { type: 'report', name: 'Rapport', role: 'Rédige la synthèse et la recommandation' },
]

export const agentName = (t: AgentType) => AGENTS.find((a) => a.type === t)!.name

export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  return `il y a ${d} j`
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`
  return `${(n / 1024 / 1024).toFixed(1)} Mo`
}

export function fmtMs(ms: number | null): string {
  if (ms == null) return '—'
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}

export function scoreTone(score: number): Tone {
  if (score >= 75) return 'ok'
  if (score >= 55) return 'warn'
  return 'err'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
