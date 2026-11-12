import { useState } from 'react'
import { PipelineDots } from '../components/AgentPipeline'
import { Avatar, Badge, Empty, Icon, ScoreRing } from '../components/ui'
import { APP_STATUS, DOC_STATUS, fmtRelative } from '../labels'
import type { Application, ApplicationStatus, Job } from '../types'

interface Props {
  apps: Application[]
  jobs: Job[]
  jobById: Record<string, Job>
  jobFilter: string
  setJobFilter: (id: string) => void
  onOpen: (id: string) => void
}

type Sort = 'recent' | 'score'

export function Applications({ apps, jobs, jobById, jobFilter, setJobFilter, onOpen }: Props) {
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('recent')

  const list = apps
    .filter(
      (a) =>
        (jobFilter === 'all' || a.job_id === jobFilter) &&
        (status === 'all' || a.status === status) &&
        (q === '' || `${a.candidate.full_name} ${a.candidate.email} ${a.candidate.headline}`.toLowerCase().includes(q.toLowerCase())),
    )
    .sort((a, b) =>
      sort === 'score'
        ? (b.analysis?.overall_score ?? -1) - (a.analysis?.overall_score ?? -1)
        : b.created_at.localeCompare(a.created_at),
    )

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Candidatures</h1>
          <p>{list.length} candidature{list.length > 1 ? 's' : ''} · cliquez sur une ligne pour voir le détail et lancer l’analyse.</p>
        </div>
      </div>

      <div className="toolbar">
        <label className="search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un candidat…" />
        </label>
        <div className="filters">
          <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} aria-label="Filtrer par offre">
            <option value="all">Toutes les offres</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | 'all')} aria-label="Filtrer par statut">
            <option value="all">Tous les statuts</option>
            {(Object.keys(APP_STATUS) as ApplicationStatus[]).map((s) => <option key={s} value={s}>{APP_STATUS[s].label}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Trier">
            <option value="recent">Plus récentes</option>
            <option value="score">Meilleur score</option>
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon="users" title="Aucune candidature" text="Modifiez les filtres pour élargir la recherche." />
      ) : (
        <div className="card flush">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Poste</th>
                  <th>Statut</th>
                  <th>Documents</th>
                  <th>Agents</th>
                  <th className="right">Score</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const bad = a.documents.filter((d) => d.status === 'inconsistent' || d.status === 'error').length
                  const ok = a.documents.filter((d) => d.status === 'verified').length
                  return (
                    <tr key={a.id} onClick={() => onOpen(a.id)}>
                      <td>
                        <div className="person">
                          <Avatar name={a.candidate.full_name} size={34} />
                          <div><strong>{a.candidate.full_name}</strong><small>{a.candidate.headline} · {fmtRelative(a.created_at)}</small></div>
                        </div>
                      </td>
                      <td className="nowrap">{jobById[a.job_id]?.title}</td>
                      <td><Badge tone={APP_STATUS[a.status].tone} dot>{APP_STATUS[a.status].label}</Badge></td>
                      <td>
                        {bad > 0 ? (
                          <Badge tone={DOC_STATUS.inconsistent.tone}><Icon name="alert" size={12} /> {bad} à vérifier</Badge>
                        ) : (
                          <span className="muted small">{ok}/{a.documents.length} vérifiés</span>
                        )}
                      </td>
                      <td>{a.analysis ? <PipelineDots executions={a.analysis.executions} /> : <span className="muted small">—</span>}</td>
                      <td className="right"><ScoreRing score={a.analysis?.overall_score ?? null} size={38} stroke={4} /></td>
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
