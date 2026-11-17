import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Download, GitBranchPlus, PenLine, BadgeCheck, Lock, Eye, History, ShieldAlert, Paperclip, Workflow, FileText, Archive } from 'lucide-react'
import { Topbar, useRole } from '../App'
import { PROCESSES, VERSIONS, LANES, NODES, EDGES, DOC, fmtDate, fmtDateTime } from '../data'
import { Rail, Seal, Tag, Avatar, FileIcon, Modal, useToast, LockedNote } from '../components/ui'
import Swimlane, { MapLegend } from '../components/Swimlane'
import ProcessDoc, { deriveSteps } from '../components/ProcessDoc'
import { ExportDialog } from '../components/dialogs'

export default function ProcessView() {
  const { id } = useParams()
  const [qs] = useSearchParams()
  const { role } = useRole()
  const nav = useNavigate()
  const toast = useToast()
  const p = PROCESSES.find((x) => x.id === id) || PROCESSES[0]
  const versions = p.id === 'p-104' ? VERSIONS : [{ v: p.version, state: p.status === 'approved' ? 'current' : 'draft', by: p.supervisor || 'Supervisor', at: p.updated, summary: 'First approved version.', author: p.creator }]
  const approvedVs = versions.filter((v) => v.state !== 'draft')
  const [viewV, setViewV] = useState(approvedVs[0]?.v || p.version)
  const [tab, setTab] = useState('map')
  const [dlg, setDlg] = useState(null)
  const viewing = versions.find((v) => v.v === viewV) || versions[0]
  const isHistorical = viewing.state === 'historical'
  const activeDraft = versions.find((v) => v.state === 'draft')
  const ownDept = p.dept === 'Office of Sponsored Programs'
  const crossView = !ownDept
  const underReview = p.status === 'review'
  const sealStatus = underReview ? 'review' : isHistorical ? 'draft' : 'approved'

  return (
    <>
      <Topbar wide crumbs={[{ label: role === 'supervisor' ? 'Department processes' : 'Process library', to: role === 'supervisor' ? '/department-processes' : '/library' }, { label: p.dept }, { label: p.name }]}>
        <button className="btn" onClick={() => setDlg('export')}><Download />Export</button>
        {role === 'supervisor' && ownDept && p.status === 'approved' && (
          <button className="btn primary" onClick={() => setDlg('reopen')} disabled={!!activeDraft} title={activeDraft ? 'A draft is already open' : ''}><GitBranchPlus />Reopen as new draft</button>
        )}
        {role === 'user' && activeDraft && <button className="btn primary" onClick={() => nav(`/process/${p.id}/edit`)}><PenLine />Continue draft v{activeDraft.v}</button>}
      </Topbar>

      <div className="proc-head">
        <div className="stack" style={{ gap: 4 }}>
          <h2>{p.name}</h2>
          <span className="small muted">{p.dept} · {p.category} · owner {p.owner}</span>
        </div>
        <Rail status={underReview ? 'review' : 'approved'} />
        <Seal v={underReview ? p.version : viewV} status={sealStatus} note={isHistorical ? 'Historical · not current' : undefined} />
        <span className="grow" />
        {approvedVs.length > 1 && (
          <div className="row gap2"><span className="hint">Viewing</span>
            <select className="select" style={{ width: 'auto' }} value={viewV} onChange={(e) => setViewV(e.target.value)} aria-label="Version">
              {approvedVs.map((v) => <option key={v.v} value={v.v}>v{v.v} {v.state === 'current' ? '· current' : '· historical'}</option>)}
            </select>
          </div>
        )}
      </div>

      {qs.get('approved') && <div className="lock-banner" style={{ background: 'var(--approved-wash)', color: '#1f4a35' }}><BadgeCheck />Approved and published. {p.creator} has been notified.</div>}
      {underReview && <LockedNote>Under review by {p.supervisor}. You can view it, but editing is locked until the review is complete.</LockedNote>}
      {isHistorical && <div className="lock-banner" style={{ background: 'var(--well)', color: 'var(--ink-2)' }}><History />You’re viewing a historical version. v{approvedVs[0].v} is the current approved version.</div>}
      {activeDraft && !isHistorical && !underReview && <div className="lock-banner"><Lock />v{viewV} is locked. A draft (v{activeDraft.v}) is in progress and won’t replace this version until it’s approved.</div>}
      {crossView && <div className="lock-banner" style={{ background: 'var(--well)', color: 'var(--ink-2)' }}><Eye />View-only access to {p.dept}, granted by your Institute Admin.{p.archivedDept && ' This department is archived; its approved processes are preserved.'}</div>}

      <div className="page wide" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start' }}>
        <div className="stack gap4" style={{ minWidth: 0 }}>
          <div className="tabs">
            <button className={tab === 'map' ? 'on' : ''} onClick={() => setTab('map')}><Workflow size={14} />Map</button>
            <button className={tab === 'doc' ? 'on' : ''} onClick={() => setTab('doc')}><FileText size={14} />Document</button>
            <button className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}><History size={14} />Version history</button>
            <button className={tab === 'files' ? 'on' : ''} onClick={() => setTab('files')}><Paperclip size={14} />Source documents</button>
          </div>

          {tab === 'map' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="map-wrap" style={{ overflow: 'auto', padding: 16 }}>
                <div style={{ border: '1px solid var(--rule)', borderRadius: 8, width: 'max-content' }}>
                  <Swimlane lanes={LANES} nodes={NODES} edges={EDGES} />
                </div>
              </div>
              <div className="pane-foot row spread wrap gap2"><MapLegend /></div>
            </div>
          )}
          {tab === 'doc' && <div className="card"><ProcessDoc doc={{ ...DOC, name: p.name, exceptions: 'If the sponsor portal rejects the submission, the SPO corrects and resubmits before the deadline.' }} steps={deriveSteps(NODES, EDGES, LANES)} version={viewV} status={isHistorical ? 'historical' : 'approved'} /></div>}
          {tab === 'history' && <VersionHistory versions={versions} onView={(v) => { setViewV(v); setTab('map') }} />}
          {tab === 'files' && (
            <div className="card card-pad stack gap2">
              {[['OSP_PreAward_Procedures_2025.pdf', 'pdf', '38 pages · used for v1.0, v2.0'], ['Routing_checklist.xlsx', 'xls', '2 sheets · used for v2.1']].map(([n, e, m]) => (
                <div key={n} className="file"><FileIcon ext={e} /><div className="stack" style={{ gap: 2 }}><span className="small" style={{ fontWeight: 500 }}>{n}</span><span className="hint">{m}</span></div><button className="btn sm" disabled={crossView} title={crossView ? 'Source documents are limited to the owning department' : ''}>Open</button></div>
              ))}
            </div>
          )}
        </div>

        <aside className="stack gap4 sticky-side">
          <div className="card">
            <div className="card-head"><h3>Catalog</h3></div>
            <dl style={{ margin: 0, padding: '4px 20px 12px', display: 'grid', gridTemplateColumns: '96px 1fr', rowGap: 10, fontSize: 13 }}>
              <dt className="muted">Department</dt><dd style={{ margin: 0 }}>{p.dept}</dd>
              <dt className="muted">Category</dt><dd style={{ margin: 0 }}>{p.category}</dd>
              <dt className="muted">Tags</dt><dd style={{ margin: 0 }} className="row wrap gap1">{p.tags.map((t) => <span key={t} className="chip">{t}</span>)}</dd>
              <dt className="muted">Creator</dt><dd style={{ margin: 0 }}>{p.creator}</dd>
              <dt className="muted">Approved by</dt><dd style={{ margin: 0 }}>{viewing.by}</dd>
              <dt className="muted">Last change</dt><dd style={{ margin: 0 }}>{(activeDraft?.lastBy || viewing.by)}<br /><span className="hint">{fmtDateTime(activeDraft?.lastAt || viewing.at)}</span></dd>
            </dl>
          </div>
          {p.id === 'p-104' && (
            <div className="notice" style={{ background: 'var(--sheet)' }}>
              <ShieldAlert style={{ color: 'var(--ink-3)' }} />
              <div className="stack gap1"><span className="small"><b>1 linked process is restricted.</b> A step depends on a Financial Aid process you don’t have access to.</span><span className="hint">Ask your Institute Admin for library access.</span></div>
            </div>
          )}
        </aside>
      </div>

      {dlg === 'export' && <ExportDialog onClose={() => setDlg(null)} versions={approvedVs.map((v) => ({ id: v.v, label: `v${v.v} · ${v.state === 'current' ? 'approved (current)' : 'historical'}` }))} />}
      {dlg === 'reopen' && (
        <Modal title="Reopen as a new draft?" sub={`v${p.version} stays approved, locked and published. Edits happen in v${(parseFloat(p.version) + 1).toFixed(1)}.`} onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" onClick={() => { setDlg(null); toast('Draft created'); nav(`/review/${p.id}`) }}><GitBranchPlus />Create draft</button></>}>
          <div className="field"><label>Why is it being revised?</label><textarea className="textarea" placeholder="This becomes the revision summary in version history." /></div>
          <span className="hint">Only one draft can be open per process.</span>
        </Modal>
      )}
    </>
  )
}

function VersionHistory({ versions, onView }) {
  return (
    <div className="card card-pad">
      <div className="vline">
        {versions.map((v) => (
          <div key={v.v} className={`vitem ${v.state === 'current' ? 'current' : ''} ${v.state === 'draft' ? 'draft' : ''}`}>
            <div className="row spread wrap gap2" style={{ alignItems: 'flex-start' }}>
              <div className="stack" style={{ gap: 4, maxWidth: '62ch' }}>
                <div className="row gap2">
                  <span className="mono" style={{ fontWeight: 500 }}>v{v.v}</span>
                  {v.state === 'current' && <Tag status="approved">Current approved</Tag>}
                  {v.state === 'historical' && <span className="tag outline">Historical</span>}
                  {v.state === 'draft' && <Tag status="draft">Draft in progress</Tag>}
                </div>
                <p className="small">{v.summary}</p>
                <span className="hint row gap2"><Avatar name={v.by} sm />{v.state === 'draft' ? `Reopened by ${v.by}` : `Approved by ${v.by}`} · {fmtDateTime(v.at)}{v.author && ` · authored by ${v.author}`}</span>
                {v.lastBy && <span className="hint">Last change by {v.lastBy} · {fmtDateTime(v.lastAt)}</span>}
                {v.note && <span className="hint" style={{ color: 'var(--ink-3)' }}><Archive size={11} /> {v.note}</span>}
              </div>
              {v.state !== 'draft' && <button className="btn sm" onClick={() => onView(v.v)}>View this version</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
