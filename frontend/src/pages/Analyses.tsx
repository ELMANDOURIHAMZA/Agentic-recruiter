import { PipelineDots } from '../components/AgentPipeline'
import { Avatar, Badge, Empty, Icon, ScoreRing } from '../components/ui'
import { AGENTS, ANALYSIS_STATUS, fmtMs, fmtRelative } from '../labels'
import type { Application, Job } from '../types'

interface Props {
  apps: Application[]
  jobById: Record<string, Job>
  onOpen: (id: string) => void
}

export function Analyses({ apps, jobById, onOpen }: Props) {
  const runs = apps
    .filter((a) => a.analysis)
    .sort((a, b) => (b.analysis!.started_at ?? '').localeCompare(a.analysis!.started_at ?? ''))
  const waiting = apps.filter((a) => !a.analysis)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Analyses IA</h1>
          <p>Chaque analyse enchaîne 5 agents spécialisés ; chaque exécution est tracée (modèle, durée, tokens).</p>
        </div>
      </div>

      <section className="flow card">
        {AGENTS.map((a, i) => (
          <div key={a.type} className="flow-step">
            <span className="flow-n">{i + 1}</span>
            <div>
              <strong>{a.name}</strong>
              <small>{a.role}</small>
            </div>
            {i < AGENTS.length - 1 && <span className="flow-arrow"><Icon name="arrow" size={16} /></span>}
          </div>
        ))}
      </section>

      {waiting.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h3>En attente d’analyse</h3>
            <span className="muted small">{waiting.length} candidature{waiting.length > 1 ? 's' : ''}</span>
          </div>
          <div className="waiting">
            {waiting.map((a) => (
              <button key={a.id} className="waiting-item" onClick={() => onOpen(a.id)}>
                <Avatar name={a.candidate.full_name} size={30} />
                <span><strong>{a.candidate.full_name}</strong><small>{jobById[a.job_id]?.title}</small></span>
                <Icon name="play" size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      {runs.length === 0 ? (
        <Empty icon="spark" title="Aucune analyse" text="Ouvrez une candidature et lancez l’analyse IA." />
      ) : (
        <div className="card flush">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Statut</th>
                  <th>Agents</th>
                  <th>Durée</th>
                  <th>Tokens</th>
                  <th>Démarrée</th>
                  <th className="right">Score</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((a) => {
                  const r = a.analysis!
                  const ms = r.executions.reduce((s, e) => s + (e.duration_ms ?? 0), 0)
                  const tk = r.executions.reduce((s, e) => s + (e.input_tokens ?? 0) + (e.output_tokens ?? 0), 0)
                  return (
                    <tr key={a.id} onClick={() => onOpen(a.id)}>
                      <td>
                        <div className="person">
                          <Avatar name={a.candidate.full_name} size={32} />
                          <div><strong>{a.candidate.full_name}</strong><small>{jobById[a.job_id]?.title}</small></div>
                        </div>
                      </td>
                      <td><Badge tone={ANALYSIS_STATUS[r.status].tone} dot>{ANALYSIS_STATUS[r.status].label}</Badge></td>
                      <td><PipelineDots executions={r.executions} /></td>
                      <td className="nowrap">{ms ? fmtMs(ms) : '—'}</td>
                      <td className="nowrap">{tk ? tk.toLocaleString('fr-FR') : '—'}</td>
                      <td className="muted small nowrap">{r.started_at ? fmtRelative(r.started_at) : '—'}</td>
                      <td className="right"><ScoreRing score={r.overall_score} size={38} stroke={4} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
