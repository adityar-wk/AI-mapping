import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Download, GitBranchPlus, PenLine, BadgeCheck, Lock, Eye, History, Paperclip, Workflow, FileText, Archive, CornerUpLeft, MessageSquareText } from 'lucide-react'
import { Topbar, useRole } from '../App'
import { PROCESSES, VERSIONS, LANES, NODES, EDGES, DOC, fmtDate, fmtDateTime, sourcesFor } from '../data'
import { Rail, Seal, Tag, Avatar, FileIcon, Modal, useToast, LockedNote } from '../components/ui'
import Swimlane, { MapLegend } from '../components/Swimlane'
import ProcessDoc, { deriveSteps } from '../components/ProcessDoc'
import { ExportDialog, ApproveDialog, ReturnDialog } from '../components/dialogs'

export default function ProcessView() {
  const { id } = useParams()
  const [qs] = useSearchParams()
  const { role } = useRole()
  const nav = useNavigate()
  const toast = useToast()
  const p = PROCESSES.find((x) => x.id === id) || PROCESSES[0]
  const versions = p.id === 'p-104' ? VERSIONS : [p.status === 'approved'
    ? { v: p.version, state: 'current', by: p.supervisor, at: p.updated, author: p.creator }
    : { v: p.version, state: 'draft', by: p.creator, at: p.updated }]
  const approvedVs = versions.filter((v) => v.state !== 'draft')
  const [viewV, setViewV] = useState(approvedVs[0]?.v || p.version)
  const [tab, setTab] = useState('map')
  const [dlg, setDlg] = useState(null)
  const viewing = versions.find((v) => v.v === viewV) || versions[0]
  const isHistorical = viewing.state === 'historical'
  const activeDraft = versions.find((v) => v.state === 'draft')
  const ownDept = p.dept === 'Office of Sponsored Programs'
  const underReview = p.status === 'review'
  const files = sourcesFor(p.id).files
  const sealStatus = underReview ? 'review' : isHistorical ? 'draft' : 'approved'

  return (
    <>
      <Topbar wide crumbs={[{ label: role === 'supervisor' ? 'Department processes' : 'My processes', to: role === 'supervisor' ? '/department-processes' : '/home' }, { label: p.dept }, { label: p.name }]}>
        <button className="btn" onClick={() => setDlg('export')}><Download />Export</button>
        {role === 'supervisor' && ownDept && p.status === 'approved' && (
          <button className="btn primary" onClick={() => setDlg('reopen')} disabled={!!activeDraft} title={activeDraft ? 'A draft is already open' : ''}><GitBranchPlus />Reopen as new draft</button>
        )}
        {/* a process waiting for this supervisor can be decided from here, or reviewed in the workspace */}
        {role === 'supervisor' && ownDept && underReview && (
          <>
            <button className="btn" onClick={() => nav(`/review/${p.id}`)}><MessageSquareText />Review with AI</button>
            <button className="btn" onClick={() => setDlg('return')}><CornerUpLeft />Return</button>
            <button className="btn primary" onClick={() => setDlg('approve')}><BadgeCheck />Approve</button>
          </>
        )}
        {role === 'user' && activeDraft && !underReview && <button className="btn primary" onClick={() => nav(`/process/${p.id}/edit`)}><PenLine />Continue draft v{activeDraft.v}</button>}
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
      {underReview && (role === 'supervisor'
        ? <LockedNote>Submitted by {p.creator} for your review. Approve or return it here, or open Review with AI to revise it first.</LockedNote>
        : <LockedNote>Under review by {p.supervisor}. You can view it, but editing is locked until the review is complete.</LockedNote>)}
      {isHistorical && <div className="lock-banner" style={{ background: 'var(--well)', color: 'var(--ink-2)' }}><History />You’re viewing a historical version. v{approvedVs[0].v} is the current approved version.</div>}
      {activeDraft && !isHistorical && !underReview && <div className="lock-banner"><Lock />v{viewV} is locked. A draft (v{activeDraft.v}) is in progress and won’t replace this version until it’s approved.</div>}

      <div className="page wide" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>
        <div className="stack gap4" style={{ minWidth: 0 }}>
          <div className="tabs">
            <button className={tab === 'map' ? 'on' : ''} onClick={() => setTab('map')}><Workflow size={14} />Map</button>
            <button className={tab === 'doc' ? 'on' : ''} onClick={() => setTab('doc')}><FileText size={14} />Document</button>
          </div>

          {tab === 'map' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="map-wrap" style={{ overflow: 'auto', padding: 16 }}>
                <div style={{ border: '1px solid var(--rule)', borderRadius: 8, width: 'max-content', margin: '0 auto' }}>
                  <Swimlane lanes={LANES} nodes={NODES} edges={EDGES} />
                </div>
              </div>
              <div className="pane-foot row wrap gap2" style={{ justifyContent: 'center' }}><MapLegend /></div>
            </div>
          )}
          {tab === 'doc' && <div className="card"><ProcessDoc doc={{ ...DOC, name: p.name, exceptions: 'If the sponsor portal rejects the submission, the SPO corrects and resubmits before the deadline.' }} steps={deriveSteps(NODES, EDGES, LANES)} version={viewV} status={isHistorical ? 'historical' : 'approved'} /></div>}
        </div>

        <aside className="stack gap4">
          <div className="card">
            <div className="card-head"><h3>Catalog</h3></div>
            <dl style={{ margin: 0, padding: '4px 20px 12px', display: 'grid', gridTemplateColumns: '96px 1fr', rowGap: 10, fontSize: 13 }}>
              <dt className="muted">Department</dt><dd style={{ margin: 0 }}>{p.dept}</dd>
              <dt className="muted">Category</dt><dd style={{ margin: 0 }}>{p.category}</dd>
              {p.status === 'approved' || p.approvedVersion ? <><dt className="muted">Tags</dt><dd style={{ margin: 0 }} className="row wrap gap1">{p.tags.map((t) => <span key={t} className="chip">{t}</span>)}</dd></> : null}
              <dt className="muted">Creator</dt><dd style={{ margin: 0 }}>{p.creator}</dd>
              {viewing.state !== 'draft' && <><dt className="muted">Approved by</dt><dd style={{ margin: 0 }}>{viewing.by}</dd></>}
              <dt className="muted">Last change</dt><dd style={{ margin: 0 }}>{activeDraft?.lastBy || (viewing.state === 'draft' ? p.creator : viewing.by)}<br /><span className="hint">{fmtDateTime(activeDraft?.lastAt || viewing.at)}</span></dd>
            </dl>
          </div>

          <div className="card">
            <div className="card-head"><h3 className="row gap2"><History size={15} />Versions</h3><span className="hint num">{versions.length}</span></div>
            <VersionHistory versions={versions} viewing={viewV} onView={(v) => setViewV(v)} />
          </div>

          <div className="card">
            <div className="card-head"><h3 className="row gap2"><Paperclip size={15} />Source documents</h3><span className="hint num">{files.length}</span></div>
            <div className="stack gap2" style={{ padding: '4px 16px 16px' }}>
              {files.length === 0 && <span className="hint">No documents were uploaded for this process.</span>}
              {files.map((f) => (
                <div key={f.name} className="file side-file"><FileIcon ext={f.ext} /><div className="stack" style={{ gap: 2, minWidth: 0 }}><span className="small" style={{ fontWeight: 500, overflowWrap: 'anywhere' }}>{f.name}</span><span className="hint">{f.meta} · used for {f.usedIn.map((v) => `v${v}`).join(', ')}</span></div><button className="btn sm">Open</button></div>
              ))}
            </div>
          </div>

        </aside>
      </div>

      {dlg === 'export' && <ExportDialog onClose={() => setDlg(null)} versions={approvedVs.map((v) => ({ id: v.v, label: `v${v.v} · ${v.state === 'current' ? 'approved (current)' : 'historical'}` }))} />}
      {dlg === 'approve' && <ApproveDialog onClose={() => setDlg(null)} author={p.creator} version={p.version} dept={p.dept} suggestedTags={p.tags}
        onDone={() => { setDlg(null); toast(`v${p.version} approved and published`); nav(`/process/${p.id}?approved=1`) }} />}
      {dlg === 'return' && <ReturnDialog onClose={() => setDlg(null)} author={p.creator}
        onDone={() => { setDlg(null); toast(`Returned to ${p.creator}`); nav('/reviews') }} />}
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

function VersionHistory({ versions, viewing, onView }) {
  return (
    <div style={{ padding: '4px 20px 16px' }}>
      <div className="vline">
        {versions.map((v) => (
          <div key={v.v} className={`vitem ${v.state === 'current' ? 'current' : ''} ${v.state === 'draft' ? 'draft' : ''}`}>
            <div className="stack gap2">
              <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                <div className="row gap2">
                  <span className="mono" style={{ fontWeight: 500 }}>v{v.v}</span>
                  {v.state === 'current' && <Tag status="approved">Current approved</Tag>}
                  {v.state === 'historical' && <span className="tag outline">Historical</span>}
                  {v.state === 'draft' && <Tag status="draft">{v.reopened ? 'Draft in progress' : 'Not yet approved'}</Tag>}
                </div>
                {v.summary && <p className="small">{v.summary}</p>}
                <span className="hint row gap2"><Avatar name={v.by} sm />{v.state === 'draft' ? `${v.reopened ? 'Reopened' : 'Created'} by ${v.by}` : `Approved by ${v.by}`} · {fmtDateTime(v.at)}{v.author && ` · authored by ${v.author}`}</span>
                {v.lastBy && <span className="hint">Last change by {v.lastBy} · {fmtDateTime(v.lastAt)}</span>}
                {v.note && <span className="hint" style={{ color: 'var(--ink-3)' }}><Archive size={11} /> {v.note}</span>}
              </div>
              {v.state !== 'draft' && (v.v === viewing
                ? <span className="hint" style={{ color: 'var(--navy)', fontWeight: 600 }}>Currently viewing</span>
                : <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => onView(v.v)}>View this version</button>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
