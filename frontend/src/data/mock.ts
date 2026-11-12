// Demo data — will be replaced by calls to the FastAPI backend once the
// /jobs, /applications and /analysis routes are implemented.
import { AGENTS } from '../labels'
import type {
  AgentExecution,
  AnalysisRun,
  Application,
  ApplicationDocument,
  Candidate,
  Job,
} from '../types'

const now = Date.now()
const ago = (hours: number) => new Date(now - hours * 3600_000).toISOString()
let seq = 1000
export const uid = (p: string) => `${p}-${(seq++).toString(36)}`

export const MODEL = 'claude-sonnet-5-5'

export const initialJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Développeur·se Backend Python',
    company_name: 'Nexora Tech',
    description:
      "Conception d'API FastAPI, modélisation PostgreSQL et intégration de pipelines IA dans une équipe produit de 8 personnes.",
    location: 'Casablanca',
    contract_type: 'CDI',
    experience_min_years: 3,
    experience_max_years: 6,
    is_remote: true,
    status: 'published',
    published_at: ago(24 * 9),
    created_at: ago(24 * 11),
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'LLM'],
  },
  {
    id: 'job-2',
    title: 'Data Scientist NLP',
    company_name: 'Nexora Tech',
    description:
      'Développement de modèles de traitement du langage pour la classification et l’extraction d’information à partir de documents.',
    location: 'Rabat',
    contract_type: 'CDI',
    experience_min_years: 2,
    experience_max_years: 5,
    is_remote: false,
    status: 'published',
    published_at: ago(24 * 5),
    created_at: ago(24 * 6),
    skills: ['Python', 'NLP', 'PyTorch', 'Embeddings', 'SQL'],
  },
  {
    id: 'job-3',
    title: 'Ingénieur·e Frontend React',
    company_name: 'Atlas Digital',
    description: "Construction d'interfaces React/TypeScript performantes et accessibles pour une plateforme SaaS RH.",
    location: 'Marrakech',
    contract_type: 'CDD',
    experience_min_years: 2,
    experience_max_years: 4,
    is_remote: true,
    status: 'published',
    published_at: ago(24 * 2),
    created_at: ago(24 * 3),
    skills: ['React', 'TypeScript', 'CSS', 'Vite', 'Tests'],
  },
  {
    id: 'job-4',
    title: 'DevOps / SRE',
    company_name: 'Atlas Digital',
    description: 'Industrialisation CI/CD, observabilité et gestion de clusters Kubernetes multi-environnements.',
    location: 'Tanger',
    contract_type: 'CDI',
    experience_min_years: 4,
    experience_max_years: 8,
    is_remote: false,
    status: 'draft',
    published_at: null,
    created_at: ago(30),
    skills: ['Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Prometheus'],
  },
  {
    id: 'job-5',
    title: 'Chef·fe de projet RH digital',
    company_name: 'Nexora Tech',
    description: "Pilotage de la transformation digitale du recrutement et coordination avec les équipes métiers.",
    location: 'Casablanca',
    contract_type: 'CDI',
    experience_min_years: 5,
    experience_max_years: 10,
    is_remote: false,
    status: 'closed',
    published_at: ago(24 * 40),
    created_at: ago(24 * 42),
    skills: ['Gestion de projet', 'SIRH', 'Agile', 'Communication'],
  },
]

const docs = (name: string, kinds: [ApplicationDocument['document_type'], ApplicationDocument['status']][]) =>
  kinds.map(([t, s], i): ApplicationDocument => {
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '_')
    const file = { cv: `CV_${slug}.pdf`, diploma: `diplome_${slug}.pdf`, identity: `cin_${slug}.jpg`, other: `attestation_${slug}.pdf` }[t]
    return {
      id: uid('doc'),
      document_type: t,
      status: s,
      original_filename: file,
      mime_type: t === 'identity' ? 'image/jpeg' : 'application/pdf',
      file_size_bytes: 180_000 + i * 97_000 + name.length * 3100,
      page_count: t === 'identity' ? null : t === 'cv' ? 2 : 1,
    }
  })

const EXEC_SUMMARIES: Record<AgentExecution['agent_type'], (c: Candidate, j: Job) => string> = {
  job_requirement: (_c, j) => `${j.skills.length} compétences clés extraites, ${j.experience_min_years ?? 0}–${j.experience_max_years ?? '∞'} ans requis.`,
  cv_extraction: (c) => `${c.years_experience} ans d'expérience, profil « ${c.headline} ».`,
  document_verification: () => 'Identité et diplôme cohérents avec le CV.',
  matching: () => 'Score pondéré calculé sur 4 axes.',
  report: () => 'Synthèse et recommandation rédigées.',
}

export function buildExecutions(c: Candidate, j: Job, docsOk: boolean): AgentExecution[] {
  return AGENTS.map((a, i) => ({
    agent_type: a.type,
    status: 'succeeded',
    attempt_number: 1,
    provider: 'anthropic',
    model_name: MODEL,
    duration_ms: 900 + ((i * 731 + c.full_name.length * 97) % 2600),
    input_tokens: 1800 + ((i * 1311 + c.email.length * 53) % 4200),
    output_tokens: 220 + ((i * 377) % 900),
    summary:
      a.type === 'document_verification' && !docsOk
        ? 'Date du diplôme incohérente avec le CV — à vérifier.'
        : EXEC_SUMMARIES[a.type](c, j),
    error_message: null,
  }))
}

export function buildRun(c: Candidate, j: Job, score: number, docsOk: boolean, hoursAgo: number): AnalysisRun {
  const b = {
    skills: Math.min(100, score + 6),
    experience: Math.max(20, Math.min(100, score - 4 + (c.years_experience >= (j.experience_min_years ?? 0) ? 8 : -15))),
    education: Math.min(100, score + 2),
    documents: docsOk ? 96 : 52,
  }
  const strong = score >= 75
  const mid = score >= 55
  return {
    id: uid('run'),
    status: 'completed',
    overall_score: score,
    breakdown: b,
    result_summary: strong
      ? `${c.full_name} correspond très bien au poste « ${j.title} ». Recommandation : entretien technique prioritaire.`
      : mid
        ? `Profil partiellement aligné avec « ${j.title} ». Recommandation : entretien exploratoire pour lever les doutes.`
        : `Écart significatif avec les exigences de « ${j.title} ». Recommandation : ne pas poursuivre pour ce poste.`,
    strengths: j.skills.slice(0, strong ? 4 : mid ? 2 : 1).map((s) => `Maîtrise démontrée de ${s}`),
    gaps: [
      ...j.skills.slice(strong ? 4 : mid ? 2 : 1, strong ? 5 : 4).map((s) => `Peu d'expérience visible sur ${s}`),
      ...(docsOk ? [] : ['Incohérence documentaire à clarifier']),
    ],
    started_at: ago(hoursAgo),
    completed_at: ago(hoursAgo - 0.01),
    executions: buildExecutions(c, j, docsOk),
  }
}

type Seed = [string, string, string, number, string, Application['status'], number | null, boolean, number]
// name, email, headline, years, jobId, status, score, docsOk, hoursAgo
const seeds: Seed[] = [
  ['Yasmine El Idrissi', 'yasmine.elidrissi@mail.ma', 'Backend Python / FastAPI', 5, 'job-1', 'shortlisted', 91, true, 30],
  ['Karim Benali', 'k.benali@mail.ma', 'Développeur Django', 4, 'job-1', 'under_review', 74, true, 20],
  ['Salma Ouazzani', 'salma.o@mail.ma', 'Ingénieure data', 2, 'job-1', 'submitted', null, true, 3],
  ['Omar Tazi', 'omar.tazi@mail.ma', 'Développeur PHP', 7, 'job-1', 'rejected', 41, false, 60],
  ['Nadia Chraibi', 'nadia.chraibi@mail.ma', 'NLP Engineer', 3, 'job-2', 'shortlisted', 88, true, 12],
  ['Mehdi Alaoui', 'mehdi.alaoui@mail.ma', 'ML Engineer', 2, 'job-2', 'under_review', 67, false, 8],
  ['Imane Fassi', 'imane.fassi@mail.ma', 'Data Analyst', 1, 'job-2', 'submitted', null, true, 1.5],
  ['Hamza Berrada', 'hamza.berrada@mail.ma', 'Frontend React / TS', 3, 'job-3', 'hired', 94, true, 70],
  ['Rania Lahlou', 'rania.lahlou@mail.ma', 'Intégratrice web', 2, 'job-3', 'under_review', 62, true, 5],
  ['Youssef Amrani', 'y.amrani@mail.ma', 'Développeur Angular', 4, 'job-3', 'submitted', null, true, 0.5],
  ['Sara Bennani', 'sara.bennani@mail.ma', 'Chef de projet SIRH', 8, 'job-5', 'withdrawn', 79, true, 24 * 20],
]

export const initialApplications: Application[] = seeds.map(([name, email, headline, years, jobId, status, score, docsOk, h]) => {
  const job = initialJobs.find((j) => j.id === jobId)!
  const candidate: Candidate = { full_name: name, email, headline, years_experience: years }
  return {
    id: uid('app'),
    job_id: jobId,
    candidate,
    status,
    cover_letter: `Bonjour, je souhaite rejoindre ${job.company_name} en tant que ${job.title}. Mon parcours de ${years} ans en tant que ${headline.toLowerCase()} m'a permis de développer des compétences directement mobilisables sur ce poste.`,
    created_at: ago(h + 2),
    documents: docs(name, [
      ['cv', score == null ? 'uploaded' : 'verified'],
      ['diploma', score == null ? 'uploaded' : docsOk ? 'verified' : 'inconsistent'],
      ['identity', score == null ? 'uploaded' : 'verified'],
    ]),
    analysis: score == null ? null : buildRun(candidate, job, score, docsOk, h),
  }
})

/** Deterministic pseudo score used by the live analysis simulation. */
export function simulatedScore(app: Application, job: Job): number {
  const overlap = job.skills.filter((s) => app.candidate.headline.toLowerCase().includes(s.toLowerCase())).length
  const base = 52 + overlap * 14 + Math.min(app.candidate.years_experience, 6) * 3
  return Math.max(28, Math.min(97, base + (app.candidate.full_name.length % 9)))
}
