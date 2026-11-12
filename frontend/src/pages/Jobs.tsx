import { useState, type FormEvent } from 'react'
import { Badge, Empty, Icon, Overlay } from '../components/ui'
import { fmtDate, JOB_STATUS } from '../labels'
import type { Application, Job, JobStatus } from '../types'

interface Props {
  jobs: Job[]
  apps: Application[]
  onCreate: (j: Omit<Job, 'id' | 'created_at' | 'published_at'>) => void
  onStatus: (id: string, s: JobStatus) => void
  onShowApplications: (jobId: string) => void
}

const TABS: { id: JobStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'published', label: 'Publiées' },
  { id: 'draft', label: 'Brouillons' },
  { id: 'closed', label: 'Fermées' },
]

export function Jobs({ jobs, apps, onCreate, onStatus, onShowApplications }: Props) {
  const [tab, setTab] = useState<JobStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)

  const list = jobs.filter(
    (j) =>
      (tab === 'all' || j.status === tab) &&
      (q === '' || `${j.title} ${j.company_name} ${j.location} ${j.skills.join(' ')}`.toLowerCase().includes(q.toLowerCase())),
  )

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Offres d’emploi</h1>
          <p>Créez et publiez vos offres. L’agent « Exigences du poste » en extrait les critères.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> Nouvelle offre</button>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
              <span>{t.id === 'all' ? jobs.length : jobs.filter((j) => j.status === t.id).length}</span>
            </button>
          ))}
        </div>
        <label className="search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un poste, une compétence…" />
        </label>
      </div>

      {list.length === 0 ? (
        <Empty icon="briefcase" title="Aucune offre" text="Aucune offre ne correspond à ces filtres." />
      ) : (
        <div className="jobs-grid">
          {list.map((j) => {
            const ja = apps.filter((a) => a.job_id === j.id)
            const sc = ja.filter((a) => a.analysis?.overall_score != null).map((a) => a.analysis!.overall_score!)
            const avg = sc.length ? Math.round(sc.reduce((s, x) => s + x, 0) / sc.length) : null
            return (
              <article key={j.id} className="job-card">
                <div className="job-top">
                  <Badge tone={JOB_STATUS[j.status].tone} dot>{JOB_STATUS[j.status].label}</Badge>
                  <span className="muted small">{fmtDate(j.published_at ?? j.created_at)}</span>
                </div>
                <h3>{j.title}</h3>
                <p className="job-company">{j.company_name}</p>
                <div className="job-meta">
                  {j.location && <span><Icon name="pin" size={14} />{j.location}</span>}
                  {j.contract_type && <span><Icon name="file" size={14} />{j.contract_type}</span>}
                  <span><Icon name="clock" size={14} />{j.experience_min_years ?? 0}–{j.experience_max_years ?? '+'} ans</span>
                  {j.is_remote && <span><Icon name="globe" size={14} />Télétravail</span>}
                </div>
                <p className="job-desc">{j.description}</p>
                <div className="chips">{j.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                <div className="job-foot">
                  <button className="job-stat" onClick={() => onShowApplications(j.id)}>
                    <b>{ja.length}</b> candidature{ja.length > 1 ? 's' : ''}
                    {avg != null && <> · score moy. <b>{avg}</b></>}
                  </button>
                  {j.status === 'draft' && <button className="btn btn-sm btn-primary" onClick={() => onStatus(j.id, 'published')}>Publier</button>}
                  {j.status === 'published' && <button className="btn btn-sm" onClick={() => onStatus(j.id, 'closed')}>Fermer</button>}
                  {j.status === 'closed' && <button className="btn btn-sm" onClick={() => onStatus(j.id, 'published')}>Rouvrir</button>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {creating && <JobForm onClose={() => setCreating(false)} onSubmit={(j) => { onCreate(j); setCreating(false) }} />}
    </div>
  )
}

function JobForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: Props['onCreate'] }) {
  const [f, setF] = useState({
    title: '',
    company_name: '',
    description: '',
    location: '',
    contract_type: 'CDI',
    min: '2',
    max: '5',
    is_remote: false,
    skills: '',
    publish: true,
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      title: f.title.trim(),
      company_name: f.company_name.trim() || null,
      description: f.description.trim(),
      location: f.location.trim() || null,
      contract_type: f.contract_type,
      experience_min_years: f.min === '' ? null : Number(f.min),
      experience_max_years: f.max === '' ? null : Number(f.max),
      is_remote: f.is_remote,
      status: f.publish ? 'published' : 'draft',
      skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean),
    })
  }

  return (
    <Overlay kind="modal" onClose={onClose}>
      <form onSubmit={submit}>
        <header className="modal-head">
          <h2>Nouvelle offre</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer"><Icon name="x" /></button>
        </header>
        <div className="form">
          <label className="field span-2">Intitulé du poste *<input required value={f.title} onChange={set('title')} placeholder="ex. Développeur·se Backend Python" /></label>
          <label className="field">Entreprise<input value={f.company_name} onChange={set('company_name')} /></label>
          <label className="field">Lieu<input value={f.location} onChange={set('location')} /></label>
          <label className="field">Contrat
            <select value={f.contract_type} onChange={set('contract_type')}>
              {['CDI', 'CDD', 'Stage', 'Freelance', 'Alternance'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <div className="field">Expérience (années)
            <div className="pair">
              <input type="number" min={0} value={f.min} onChange={set('min')} aria-label="Minimum" />
              <span>à</span>
              <input type="number" min={0} value={f.max} onChange={set('max')} aria-label="Maximum" />
            </div>
          </div>
          <label className="field span-2">Description *<textarea required rows={4} value={f.description} onChange={set('description')} /></label>
          <label className="field span-2">Compétences clés<input value={f.skills} onChange={set('skills')} placeholder="Python, FastAPI, PostgreSQL" /></label>
          <label className="check"><input type="checkbox" checked={f.is_remote} onChange={(e) => setF({ ...f, is_remote: e.target.checked })} /> Télétravail possible</label>
          <label className="check"><input type="checkbox" checked={f.publish} onChange={(e) => setF({ ...f, publish: e.target.checked })} /> Publier immédiatement</label>
        </div>
        <footer className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Créer l’offre</button>
        </footer>
      </form>
    </Overlay>
  )
}
