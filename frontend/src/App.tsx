import { useCallback, useMemo, useState } from 'react'
import { ApplicationDrawer } from './components/ApplicationDrawer'
import { Icon } from './components/ui'
import { buildExecutions, buildRun, initialApplications, initialJobs, simulatedScore, uid } from './data/mock'
import { AGENTS } from './labels'
import { Analyses } from './pages/Analyses'
import { Applications } from './pages/Applications'
import { Dashboard } from './pages/Dashboard'
import { Jobs } from './pages/Jobs'
import type { Application, ApplicationStatus, Job, JobStatus, Page } from './types'

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { id: 'jobs', label: "Offres d'emploi", icon: 'briefcase' },
  { id: 'applications', label: 'Candidatures', icon: 'users' },
  { id: 'analyses', label: 'Analyses IA', icon: 'spark' },
]

const STEP_MS = 1100

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [apps, setApps] = useState<Application[]>(initialApplications)
  const [openAppId, setOpenAppId] = useState<string | null>(null)
  const [jobFilter, setJobFilter] = useState<string>('all')
  const [navOpen, setNavOpen] = useState(false)

  const jobById = useMemo(() => Object.fromEntries(jobs.map((j) => [j.id, j])), [jobs])
  const openApp = apps.find((a) => a.id === openAppId) ?? null

  const go = (p: Page) => {
    setPage(p)
    setNavOpen(false)
    window.scrollTo({ top: 0 })
  }

  const createJob = (job: Omit<Job, 'id' | 'created_at' | 'published_at'>) => {
    const iso = new Date().toISOString()
    setJobs((js) => [{ ...job, id: uid('job'), created_at: iso, published_at: job.status === 'published' ? iso : null }, ...js])
  }

  const setJobStatus = (id: string, status: JobStatus) =>
    setJobs((js) =>
      js.map((j) => (j.id === id ? { ...j, status, published_at: status === 'published' ? new Date().toISOString() : j.published_at } : j)),
    )

  const setAppStatus = (id: string, status: ApplicationStatus) =>
    setApps((as) => as.map((a) => (a.id === id ? { ...a, status } : a)))

  const patchApp = (id: string, fn: (a: Application) => Application) => setApps((as) => as.map((a) => (a.id === id ? fn(a) : a)))

  const runAnalysis = useCallback(
    (id: string) => {
      const app = apps.find((a) => a.id === id)
      if (!app || app.analysis?.status === 'running') return
      const job = jobById[app.job_id]
      const score = simulatedScore(app, job)
      const docsOk = score >= 50
      const final = buildRun(app.candidate, job, score, docsOk, 0)
      const execs = buildExecutions(app.candidate, job, docsOk)
      const started = new Date().toISOString()

      patchApp(id, (a) => ({
        ...a,
        status: a.status === 'submitted' ? 'under_review' : a.status,
        documents: a.documents.map((d) => ({ ...d, status: 'processing' })),
        analysis: {
          ...final,
          status: 'running',
          overall_score: null,
          breakdown: null,
          result_summary: null,
          strengths: [],
          gaps: [],
          started_at: started,
          completed_at: null,
          executions: AGENTS.map((ag) => ({
            agent_type: ag.type,
            status: 'pending',
            attempt_number: 1,
            provider: 'anthropic',
            model_name: null,
            duration_ms: null,
            input_tokens: null,
            output_tokens: null,
            summary: null,
            error_message: null,
          })),
        },
      }))

      AGENTS.forEach((_, i) => {
        setTimeout(() => {
          patchApp(id, (a) => ({
            ...a,
            analysis: a.analysis && {
              ...a.analysis,
              executions: a.analysis.executions.map((e, k) =>
                k === i ? { ...e, status: 'running', model_name: execs[i].model_name } : k === i - 1 ? execs[k] : e,
              ),
            },
          }))
        }, i * STEP_MS + 150)
      })

      setTimeout(() => {
        patchApp(id, (a) => ({
          ...a,
          documents: a.documents.map((d) => ({
            ...d,
            status: d.document_type === 'diploma' && !docsOk ? 'inconsistent' : 'verified',
          })),
          analysis: { ...final, started_at: started, completed_at: new Date().toISOString(), executions: execs },
        }))
      }, AGENTS.length * STEP_MS + 150)
    },
    [apps, jobById],
  )

  const showJobApplications = (jobId: string) => {
    setJobFilter(jobId)
    go('applications')
  }

  const running = apps.filter((a) => a.analysis?.status === 'running').length

  return (
    <div className="shell">
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><Icon name="spark" size={18} /></span>
          <div>
            <strong>Agentic Recruiter</strong>
            <small>Recrutement par agents IA</small>
          </div>
        </div>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => go(n.id)}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.id === 'analyses' && running > 0 && <span className="nav-pill">{running}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="agent-status">
            <span className="pulse" />
            <div>
              <strong>5 agents actifs</strong>
              <small>anthropic · claude-sonnet-5-5</small>
            </div>
          </div>
          <div className="me">
            <span className="avatar" style={{ ['--h' as string]: 250 }}>RH</span>
            <div>
              <strong>Équipe recrutement</strong>
              <small>Recruteur</small>
            </div>
          </div>
        </div>
      </aside>
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}

      <main className="main">
        <header className="mobile-bar">
          <button className="icon-btn" onClick={() => setNavOpen(true)} aria-label="Menu"><Icon name="menu" /></button>
          <strong>Agentic Recruiter</strong>
        </header>

        {page === 'dashboard' && <Dashboard jobs={jobs} apps={apps} jobById={jobById} onOpenApp={setOpenAppId} go={go} />}
        {page === 'jobs' && (
          <Jobs jobs={jobs} apps={apps} onCreate={createJob} onStatus={setJobStatus} onShowApplications={showJobApplications} />
        )}
        {page === 'applications' && (
          <Applications apps={apps} jobs={jobs} jobById={jobById} jobFilter={jobFilter} setJobFilter={setJobFilter} onOpen={setOpenAppId} />
        )}
        {page === 'analyses' && <Analyses apps={apps} jobById={jobById} onOpen={setOpenAppId} />}
      </main>

      {openApp && (
        <ApplicationDrawer
          app={openApp}
          job={jobById[openApp.job_id]}
          onClose={() => setOpenAppId(null)}
          onStatus={(s) => setAppStatus(openApp.id, s)}
          onRun={() => runAnalysis(openApp.id)}
        />
      )}
    </div>
  )
}
