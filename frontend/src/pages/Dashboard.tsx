import { PipelineDots } from '../components/AgentPipeline'
import { Avatar, Badge, Icon, ScoreRing } from '../components/ui'
import { AGENTS, APP_STATUS, fmtMs, fmtRelative } from '../labels'
import type { Application, ApplicationStatus, Job, Page } from '../types'

interface Props {
  jobs: Job[]
  apps: Application[]
  jobById: Record<string, Job>
  onOpenApp: (id: string) => void
  go: (p: Page) => void
}

const FUNNEL: ApplicationStatus[] = ['submitted', 'under_review', 'shortlisted', 'hired', 'rejected']

export function Dashboard({ jobs, apps, jobById, onOpenApp, go }: Props) {
  const published = jobs.filter((j) => j.status === 'published').length
  const done = apps.filter((a) => a.analysis?.status === 'completed')
  const scores = done.map((a) => a.analysis!.overall_score!)
  const avg = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null
  const pending = apps.filter((a) => !a.analysis).length
  const top = [...done].sort((a, b) => b.analysis!.overall_score! - a.analysis!.overall_score!).slice(0, 5)
  const recent = [...apps].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6)
  const maxFunnel = Math.max(1, ...FUNNEL.map((s) => apps.filter((a) => a.status === s).length))

  const agentStats = AGENTS.map((ag) => {
    const ex = done.flatMap((a) => a.analysis!.executions.filter((e) => e.agent_type === ag.type && e.status === 'succeeded'))
    const avgMs = ex.length ? ex.reduce((s, e) => s + (e.duration_ms ?? 0), 0) / ex.length : 0
    const tokens = ex.reduce((s, e) => s + (e.input_tokens ?? 0) + (e.output_tokens ?? 0), 0)
    return { ...ag, runs: ex.length, avgMs, tokens }
  })

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tableau de bord</h1>
          <p>Vue d’ensemble du recrutement et de l’activité des agents IA.</p>
        </div>
        <button className="btn btn-primary" onClick={() => go('jobs')}><Icon name="plus" size={16} /> Nouvelle offre</button>
      </div>

      <div className="kpis">
        <Kpi icon="briefcase" label="Offres publiées" value={published} hint={`${jobs.length} offres au total`} />
        <Kpi icon="users" label="Candidatures" value={apps.length} hint={`${pending} en attente d’analyse`} />
        <Kpi icon="spark" label="Analyses terminées" value={done.length} hint={`${Math.round((done.length / Math.max(1, apps.length)) * 100)} % des candidatures`} />
        <Kpi icon="bolt" label="Score moyen" value={avg ?? '—'} hint="sur 100, tous postes" />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h3>Meilleurs profils</h3>
            <button className="link" onClick={() => go('analyses')}>Toutes les analyses <Icon name="arrow" size={14} /></button>
          </div>
          <ul className="rank">
            {top.map((a, i) => (
              <li key={a.id} onClick={() => onOpenApp(a.id)}>
                <span className="rank-n">{i + 1}</span>
                <Avatar name={a.candidate.full_name} size={34} />
                <div className="grow">
                  <strong>{a.candidate.full_name}</strong>
                  <small>{jobById[a.job_id]?.title}</small>
                </div>
                <ScoreRing score={a.analysis!.overall_score} size={40} stroke={4} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="card-head"><h3>Entonnoir des candidatures</h3></div>
          <div className="funnel">
            {FUNNEL.map((s) => {
              const n = apps.filter((a) => a.status === s).length
              return (
                <div key={s} className="funnel-row">
                  <span>{APP_STATUS[s].label}</span>
                  <span className={`funnel-bar tone-${APP_STATUS[s].tone}`}><span style={{ width: `${(n / maxFunnel) * 100}%` }} /></span>
                  <b>{n}</b>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Activité des agents</h3>
          <span className="muted small">Moyennes sur {done.length} analyses</span>
        </div>
        <div className="agents-row">
          {agentStats.map((a, i) => (
            <div key={a.type} className="agent-card">
              <span className="agent-idx">{i + 1}</span>
              <strong>{a.name}</strong>
              <small>{a.role}</small>
              <div className="agent-nums">
                <span><b>{a.runs}</b> exéc.</span>
                <span><b>{fmtMs(Math.round(a.avgMs))}</b> moy.</span>
                <span><b>{(a.tokens / 1000).toFixed(1)}k</b> tokens</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Candidatures récentes</h3>
          <button className="link" onClick={() => go('applications')}>Voir tout <Icon name="arrow" size={14} /></button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {recent.map((a) => (
                <tr key={a.id} onClick={() => onOpenApp(a.id)}>
                  <td>
                    <div className="person">
                      <Avatar name={a.candidate.full_name} size={32} />
                      <div><strong>{a.candidate.full_name}</strong><small>{jobById[a.job_id]?.title}</small></div>
                    </div>
                  </td>
                  <td><Badge tone={APP_STATUS[a.status].tone} dot>{APP_STATUS[a.status].label}</Badge></td>
                  <td>{a.analysis ? <PipelineDots executions={a.analysis.executions} /> : <span className="muted small">Non analysée</span>}</td>
                  <td className="muted small right">{fmtRelative(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Kpi({ icon, label, value, hint }: { icon: string; label: string; value: number | string; hint: string }) {
  return (
    <div className="kpi">
      <span className="kpi-icon"><Icon name={icon} /></span>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      <span className="kpi-hint">{hint}</span>
    </div>
  )
}
