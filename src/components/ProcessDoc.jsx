import { useState } from 'react'
import { PenLine, AlertTriangle } from 'lucide-react'

// SOW 3.9 — the 13 structured fields, in contract order
export const FIELDS = [
  ['name', 'Process name'],
  ['owner', 'Process owner'],
  ['operator', 'Process operator'],
  ['purpose', 'Purpose'],
  ['scope', 'Scope'],
  ['stakeholders', 'Stakeholders'],
  ['triggers', 'Triggers'],
  ['inputs', 'Inputs'],
  ['outputs', 'Outputs'],
  ['systems', 'Systems used'],
  ['permissions', 'Permissions'],
  ['exceptions', 'Exceptions'],
]

export function deriveSteps(nodes, edges, lanes) {
  const laneName = Object.fromEntries(lanes.map((l) => [l.id, l.name]))
  const label = Object.fromEntries(nodes.map((n) => [n.id, n.label]))
  return [...nodes]
    .filter((n) => n.type !== 'parallel')
    .sort((a, b) => a.col - b.col || a.lane.localeCompare(b.lane))
    .map((n) => {
      const outs = edges.filter((e) => e.from === n.id)
      const branches = n.type === 'decision' ? outs.map((e) => `${e.label || 'Then'} → ${label[e.to]}`) : []
      const parallel = edges.some((e) => e.to === n.id && nodes.find((x) => x.id === e.from)?.type === 'parallel' && nodes.find((x) => x.id === e.from)?.label === 'Split')
      return { id: n.id, type: n.type, label: n.label, who: laneName[n.lane], branches, parallel }
    })
}

export default function ProcessDoc({ doc, steps, editable, onEditField, changed = [], version, status }) {
  const [editing, setEditing] = useState(null)
  const [val, setVal] = useState('')

  return (
    <article className="doc" aria-label="Written process document">
      <div className="row spread wrap" style={{ alignItems: 'flex-start' }}>
        <div className="stack gap1">
          <span className="eyebrow">Process document {version && <>· <span className="mono">v{version}</span></>}{status && <> · {status}</>}</span>
          <div className="doc-title">{doc.name}</div>
        </div>
      </div>

      <div className="doc-grid">
        {FIELDS.slice(1).map(([k, label]) => (
          <Row key={k} k={k} label={label} value={doc[k]} editable={editable} changed={changed.includes(k)}
            editing={editing === k}
            onStart={() => { setEditing(k); setVal(doc[k] || '') }}
            val={val} setVal={setVal}
            onCancel={() => setEditing(null)}
            onSave={() => { onEditField?.(k, val); setEditing(null) }} />
        ))}
      </div>

      <h3 style={{ marginTop: 32 }}>Process steps</h3>
      <p className="small muted" style={{ marginTop: 4 }}>Generated from the swimlane map. Edit steps on the map, then use “Update document”.</p>
      <ol className="doc-steps">
        {steps.map((s, i) => (
          <li key={s.id} className={changed.includes(s.id) ? 'changed' : ''} style={changed.includes(s.id) ? { background: 'linear-gradient(90deg, var(--navy-tint), transparent)' } : undefined}>
            <span className="n">{String(i + 1).padStart(2, '0')}</span>
            <div className="stack" style={{ gap: 2 }}>
              <span style={{ fontWeight: 500 }}>
                {s.type === 'start' && 'Trigger: '}{s.type === 'end' && 'End: '}{s.type === 'decision' && 'Decision: '}{s.label}
              </span>
              <span className="who">{s.who}{s.parallel && ' · runs in parallel'}</span>
              {s.branches.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 13, color: 'var(--ink-2)' }}>
                  {s.branches.map((b) => <li key={b} style={{ display: 'list-item', padding: 0, border: 0, gridTemplateColumns: 'none' }}>{b}</li>)}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </article>
  )
}

function Row({ k, label, value, editable, changed, editing, onStart, val, setVal, onCancel, onSave }) {
  return (
    <>
      <div className="k">{label}</div>
      <div className={`v ${changed ? 'changed' : ''}`}>
        {editing ? (
          <div className="stack gap2">
            <textarea className="textarea" autoFocus value={val} onChange={(e) => setVal(e.target.value)} rows={3} aria-label={label} />
            <div className="row gap2">
              <button className="btn sm primary" onClick={onSave}>Save field</button>
              <button className="btn sm ghost" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
            <div className="grow">
              {value ? value : (
                <span className="missing row gap1" style={{ gap: 6 }}><AlertTriangle size={14} />Not yet described — AI will ask, nothing is invented</span>
              )}
            </div>
            {editable && <button className="btn ghost sm icon" onClick={onStart} aria-label={`Edit ${label}`}><PenLine /></button>}
          </div>
        )}
      </div>
    </>
  )
}
