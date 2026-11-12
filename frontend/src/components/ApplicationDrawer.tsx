import { ANALYSIS_STATUS, APP_STATUS, DOC_STATUS, DOC_TYPE, fmtBytes, fmtDate, fmtMs, fmtRelative } from '../labels'
import type { Application, ApplicationStatus, Job } from '../types'
import { AgentPipeline } from './AgentPipeline'
import { Avatar, Badge, Bar, Empty, Icon, Overlay, ScoreRing } from './ui'

interface Props {
  app: Application
  job: Job
  onClose: () => void
  onStatus: (s: ApplicationStatus) => void
  onRun: () => void
}

const BREAKDOWN_LABELS = { skills: 'Compétences', experience: 'Expérience', education: 'Formation', documents: 'Documents' }

export function ApplicationDrawer({ app, job, onClose, onStatus, onRun }: Props) {
  const run = app.analysis
  const running = run?.status === 'running'
  const done = run?.status === 'completed'
  const totalMs = run?.executions.reduce((s, e) => s + (e.duration_ms ?? 0), 0) ?? 0
  const totalTokens = run?.executions.reduce((s, e) => s + (e.input_tokens ?? 0) + (e.output_tokens ?? 0), 0) ?? 0
  const final = app.status === 'hired' || app.status === 'rejected' || app.status === 'withdrawn'

  return (
    <Overlay kind="drawer" onClose={onClose}>
      <header className="drawer-head">
        <Avatar name={app.candidate.full_name} size={48} />
        <div className="drawer-title">
          <h2>{app.candidate.full_name}</h2>
          <p>{app.candidate.headline} · {app.candidate.years_experience} ans d'exp.</p>
          <div className="drawer-tags">
            <Badge tone={APP_STATUS[app.status].tone} dot>{APP_STATUS[app.status].label}</Badge>
            <span className="muted">{job.title} · {fmtRelative(app.created_at)}</span>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Fermer"><Icon name="x" /></button>
      </header>

      <div className="drawer-actions">
        <button className="btn btn-primary" onClick={onRun} disabled={running}>
          {running ? <><span className="spinner light" /> Analyse en cours…</> : <><Icon name="play" size={15} /> {run ? 'Relancer l’analyse' : 'Lancer l’analyse IA'}</>}
        </button>
        {!final && (
          <>
            {app.status !== 'shortlisted' && <button className="btn" onClick={() => onStatus('shortlisted')}><Icon name="check" size={15} /> Présélectionner</button>}
            {app.status === 'shortlisted' && <button className="btn" onClick={() => onStatus('hired')}><Icon name="check" size={15} /> Embaucher</button>}
            <button className="btn btn-danger-ghost" onClick={() => onStatus('rejected')}>Refuser</button>
          </>
        )}
        {final && <button className="btn" onClick={() => onStatus('under_review')}>Remettre en revue</button>}
      </div>

      <div className="drawer-body">
        <section className="panel">
          <div className="panel-head">
            <h3>Évaluation IA</h3>
            {run && <Badge tone={ANALYSIS_STATUS[run.status].tone}>{ANALYSIS_STATUS[run.status].label}</Badge>}
          </div>
          {!run && <Empty icon="spark" title="Pas encore analysée" text="Lancez l’analyse pour faire évaluer cette candidature par les 5 agents." />}
          {running && (
            <div className="analysing">
              <span className="spinner big" />
              <p>Les agents analysent la candidature…</p>
            </div>
          )}
          {done && run.breakdown && (
            <>
              <div className="eval">
                <ScoreRing score={run.overall_score} size={96} stroke={9} />
                <div className="eval-bars">
                  {(Object.keys(BREAKDOWN_LABELS) as (keyof typeof BREAKDOWN_LABELS)[]).map((k) => (
                    <div key={k} className="eval-row">
                      <span>{BREAKDOWN_LABELS[k]}</span>
                      <Bar value={run.breakdown![k]} />
                      <b>{run.breakdown![k]}</b>
                    </div>
                  ))}
                </div>
              </div>
              <p className="summary">{run.result_summary}</p>
              <div className="sg">
                <div>
                  <h4 className="ok-text">Points forts</h4>
                  <ul>{run.strengths.map((s) => <li key={s}><Icon name="check" size={14} />{s}</li>)}</ul>
                </div>
                <div>
                  <h4 className="warn-text">Points d’attention</h4>
                  <ul>{run.gaps.length ? run.gaps.map((s) => <li key={s}><Icon name="alert" size={14} />{s}</li>) : <li className="muted">Aucun</li>}</ul>
                </div>
              </div>
            </>
          )}
        </section>

        {run && (
          <section className="panel">
            <div className="panel-head">
              <h3>Pipeline des agents</h3>
              {done && <span className="muted small">{fmtMs(totalMs)} · {totalTokens.toLocaleString('fr-FR')} tokens</span>}
            </div>
            <AgentPipeline executions={run.executions} />
          </section>
        )}

        <section className="panel">
          <div className="panel-head"><h3>Documents</h3><span className="muted small">{app.documents.length} fichiers</span></div>
          <ul className="docs">
            {app.documents.map((d) => (
              <li key={d.id}>
                <span className="doc-icon"><Icon name="file" /></span>
                <div>
                  <strong>{d.original_filename}</strong>
                  <small>{DOC_TYPE[d.document_type]} · {fmtBytes(d.file_size_bytes)}{d.page_count ? ` · ${d.page_count} p.` : ''}</small>
                </div>
                <Badge tone={DOC_STATUS[d.status].tone}>{DOC_STATUS[d.status].label}</Badge>
              </li>
            ))}
          </ul>
        </section>

        {app.cover_letter && (
          <section className="panel">
            <div className="panel-head"><h3>Lettre de motivation</h3></div>
            <p className="letter">{app.cover_letter}</p>
          </section>
        )}

        <section className="panel">
          <div className="panel-head"><h3>Contact</h3></div>
          <dl className="kv">
            <dt>E-mail</dt><dd>{app.candidate.email}</dd>
            <dt>Poste</dt><dd>{job.title} — {job.company_name}</dd>
            <dt>Reçue le</dt><dd>{fmtDate(app.created_at)}</dd>
          </dl>
        </section>
      </div>
    </Overlay>
  )
}
