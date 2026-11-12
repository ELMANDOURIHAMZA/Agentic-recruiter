import { AGENTS, EXEC_STATUS, fmtMs } from '../labels'
import type { AgentExecution } from '../types'
import { Badge, Icon } from './ui'

const AGENT_ICON: Record<string, string> = {
  job_requirement: 'briefcase',
  cv_extraction: 'file',
  document_verification: 'check',
  matching: 'bolt',
  report: 'spark',
}

export function AgentPipeline({ executions }: { executions: AgentExecution[] }) {
  return (
    <ol className="pipeline">
      {AGENTS.map((a, i) => {
        const e = executions.find((x) => x.agent_type === a.type)
        const st = e?.status ?? 'pending'
        return (
          <li key={a.type} className={`step step-${st}`}>
            <span className="step-node">
              {st === 'succeeded' ? <Icon name="check" size={15} /> : st === 'failed' ? <Icon name="x" size={15} /> : st === 'running' ? <span className="spinner" /> : <Icon name={AGENT_ICON[a.type]} size={15} />}
            </span>
            <div className="step-body">
              <div className="step-head">
                <strong>
                  <span className="step-idx">{i + 1}</span>
                  {a.name}
                </strong>
                <Badge tone={EXEC_STATUS[st].tone}>{EXEC_STATUS[st].label}</Badge>
              </div>
              <p className="step-text">{e?.summary ?? e?.error_message ?? a.role}</p>
              {st === 'succeeded' && e && (
                <div className="step-meta">
                  <span><Icon name="cpu" size={13} />{e.model_name}</span>
                  <span><Icon name="clock" size={13} />{fmtMs(e.duration_ms)}</span>
                  <span>{(e.input_tokens ?? 0).toLocaleString('fr-FR')} → {(e.output_tokens ?? 0).toLocaleString('fr-FR')} tokens</span>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Compact five-dot view used in tables. */
export function PipelineDots({ executions }: { executions: AgentExecution[] }) {
  return (
    <span className="dots" aria-label="Progression des agents">
      {AGENTS.map((a) => {
        const st = executions.find((x) => x.agent_type === a.type)?.status ?? 'pending'
        return <span key={a.type} className={`dot dot-${st}`} title={`${a.name} : ${EXEC_STATUS[st].label}`} />
      })}
    </span>
  )
}
