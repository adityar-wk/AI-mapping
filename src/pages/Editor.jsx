import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Sparkles, Mic, Send, Wand2, Download, Save, CheckCircle2, Loader2, LayoutGrid, Workflow, FileText, Columns2,
  RefreshCw, AlertTriangle, CornerUpLeft, BadgeCheck, Trash2, Plus, ArrowRight, Paperclip, MessageSquareText, Info, MousePointerClick, Eye,
} from 'lucide-react'
import { Topbar } from '../App'
import { PROCESSES, LANES, NODES, EDGES, DOC, PERSONAS } from '../data'
import { Rail, Seal, Tag, FileIcon, useToast, LockedNote } from '../components/ui'
import Swimlane, { MapLegend } from '../components/Swimlane'
import ProcessDoc, { deriveSteps } from '../components/ProcessDoc'
import { ExportDialog, SubmitDialog, ApproveDialog, ReturnDialog } from '../components/dialogs'

export default function Editor({ mode }) {
  const { id } = useParams()
  const [qs] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const review = mode === 'review'
  const proc = PROCESSES.find((p) => p.id === id) || PROCESSES[0]
  const author = review ? proc.creator : PERSONAS.user.name

  const [nodes, setNodes] = useState(NODES)
  const [edges, setEdges] = useState(EDGES)
  const [offsets, setOffsets] = useState({})
  const [doc, setDoc] = useState({ ...DOC, name: proc.name })
  const [docSteps, setDocSteps] = useState(() => deriveSteps(NODES, EDGES, LANES))
  const [sync, setSync] = useState(null) // null | 'doc-stale' | 'map-stale'
  const [changed, setChanged] = useState([])
  const [sel, setSel] = useState(null)
  const [selEdge, setSelEdge] = useState(null)
  const [view, setView] = useState('split')
  const [panel, setPanel] = useState(review ? 'sources' : 'ai')
  const [save, setSave] = useState('saved') // saved | saving | dirty
  const [dialog, setDialog] = useState(null)
  const [status, setStatus] = useState(proc.status === 'returned' ? 'returned' : review ? 'review' : 'draft')

  const dirty = () => setSave('dirty')
  const mapEdit = () => { setSync('doc-stale'); dirty() }

  const onMove = (nid, o) => { setOffsets((x) => ({ ...x, [nid]: o })); dirty() } // layout only — no sync flag
  const relabel = (nid, label) => { setNodes((ns) => ns.map((n) => (n.id === nid ? { ...n, label } : n))); mapEdit() }
  const retype = (nid, type) => { setNodes((ns) => ns.map((n) => (n.id === nid ? { ...n, type } : n))); mapEdit() }
  const setEdge = (eid, patch) => { setEdges((es) => es.map((e) => (e.id === eid ? { ...e, ...patch } : e))); mapEdit() }
  const delEdge = (eid) => { setEdges((es) => es.filter((e) => e.id !== eid)); setSelEdge(null); mapEdit() }
  const addEdge = (from, to, label) => { setEdges((es) => [...es, { id: `e${Date.now()}`, from, to, label: label || undefined }]); mapEdit() }

  const updateDocument = () => { setDocSteps(deriveSteps(nodes, edges, LANES)); setSync(null); toast('Document updated from the map') }
  const updateMap = () => { setSync(null); toast('Map updated from the document') }
  const editField = (k, v) => { setDoc((d) => ({ ...d, [k]: v })); setChanged((c) => [...c, k]); setSync('map-stale'); dirty() }

  const applyAI = (rev) => {
    setNodes((ns) => ns.map((n) => (rev.node && n.id === rev.node.id ? { ...n, label: rev.node.label } : n)))
    const nn = nodes.map((n) => (rev.node && n.id === rev.node.id ? { ...n, label: rev.node.label } : n))
    setDocSteps(deriveSteps(nn, edges, LANES))
    if (rev.field) setDoc((d) => ({ ...d, [rev.field.k]: rev.field.v }))
    setChanged([rev.node?.id, rev.field?.k].filter(Boolean))
    dirty()
  }

  const doSave = () => { setSave('saving'); setTimeout(() => setSave('saved'), 700) }
  const locked = status === 'review' && !review
  const steps = docSteps

  const versions = [
    { id: 'd', label: `v${proc.version} · ${review ? 'submitted' : 'draft'} · saved Nov 16, 3:42 PM` },
    ...(proc.approvedVersion ? [{ id: 'a', label: `v${proc.approvedVersion} · approved (current)` }] : []),
  ]

  return (
    <>
      <Topbar wide crumbs={review
        ? [{ label: 'Review queue', to: '/reviews' }, { label: proc.name }]
        : [{ label: 'My processes', to: '/home' }, { label: proc.name }]}>
        <SaveState s={save} />
        <button className="btn" onClick={() => setDialog('export')}><Download />Export</button>
        {!review && (
          <>
            <button className="btn" onClick={doSave} disabled={save !== 'dirty'}><Save />Save draft</button>
            <button className="btn primary" onClick={() => setDialog('submit')} disabled={!!sync}>{status === 'returned' ? 'Resubmit' : 'Submit for review'}</button>
          </>
        )}
        {review && status === 'review' && (
          <>
            <button className="btn" onClick={() => setDialog('return')}><CornerUpLeft />Return</button>
            <button className="btn primary" onClick={() => setDialog('approve')}><BadgeCheck />Approve</button>
          </>
        )}
      </Topbar>

      <div className="proc-head">
        <div className="stack" style={{ gap: 4 }}>
          <h2>{doc.name}</h2>
          <span className="small muted">{proc.dept} · {proc.category} · {review ? <>submitted by <b style={{ fontWeight: 500, color: 'var(--ink-2)' }}>{proc.creator}</b></> : <>reviewer {proc.supervisor}</>}</span>
        </div>
        <Rail status={status} />
        <Seal v={proc.version} status={status === 'approved' ? 'approved' : status} />
        {proc.approvedVersion && proc.approvedVersion !== proc.version && <span className="hint">v{proc.approvedVersion} remains the published version until this is approved</span>}
      </div>

      {qs.get('generated') && !review && (
        <div className="lock-banner" style={{ background: 'var(--approved-wash)', color: '#1f4a35' }}><Sparkles />Generated from your conversation and 2 confirmed documents. Check both the map and the document before submitting.</div>
      )}
      {status === 'returned' && !review && (
        <div className="lock-banner" style={{ background: 'var(--returned-wash)', color: '#5d430f' }}><CornerUpLeft />
          <span><b>Returned by {proc.supervisor}:</b> {proc.feedback || 'Please add the escalation path.'}</span>
        </div>
      )}
      {review && <LockedNote>Locked for {proc.creator} while you review. Your revisions apply directly — you don’t have to return it to make changes.</LockedNote>}

      <div className="workspace" style={{ height: 'auto', minHeight: 'calc(100vh - 56px - 72px)', gridTemplateColumns: 'minmax(330px, 380px) 1fr' }}>
        {/* ── side panel ── */}
        <aside className="pane" style={{ background: 'var(--paper)' }}>
          <div className="pane-head" style={{ padding: '0 16px' }}>
            <div className="tabs" style={{ borderBottom: 0, gap: 16 }}>
              <button className={panel === 'ai' ? 'on' : ''} onClick={() => setPanel('ai')}><Sparkles size={14} />{review ? 'Review with AI' : 'Revise with AI'}</button>
              <button className={panel === 'edit' ? 'on' : ''} onClick={() => setPanel('edit')}><MousePointerClick size={14} />Edit map</button>
              {review && <button className={panel === 'sources' ? 'on' : ''} onClick={() => setPanel('sources')}><Paperclip size={14} />Sources</button>}
            </div>
          </div>
          <div className="pane-body">
            {panel === 'ai' && <AIPanel review={review} onApply={applyAI} />}
            {panel === 'edit' && (
              <Inspector nodes={nodes} edges={edges} sel={sel} selEdge={selEdge} setSel={setSel} setSelEdge={setSelEdge}
                relabel={relabel} retype={retype} setEdge={setEdge} delEdge={delEdge} addEdge={addEdge} />
            )}
            {panel === 'sources' && <SourcesPanel />}
          </div>
        </aside>

        {/* ── outputs ── */}
        <section className="pane" style={{ minWidth: 0 }}>
          <div className="map-toolbar">
            <div className="seg" role="tablist" aria-label="Output view">
              <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}><Workflow />Map</button>
              <button className={view === 'doc' ? 'on' : ''} onClick={() => setView('doc')}><FileText />Document</button>
              <button className={view === 'split' ? 'on' : ''} onClick={() => setView('split')}><Columns2 />Both</button>
            </div>
            <span className="grow" />
            {view !== 'doc' && <>
              <span className="hint">Drag steps to rearrange — position doesn’t change the logic</span>
              <button className="btn sm" onClick={() => { setOffsets({}); toast('Automatic layout applied') }}><LayoutGrid />Auto layout</button>
            </>}
          </div>

          {sync === 'doc-stale' && (
            <div className="syncbar"><AlertTriangle /><span className="grow"><b>The map changed.</b> The written document still describes the previous flow.</span><button className="btn sm" onClick={updateDocument}><RefreshCw />Update document</button></div>
          )}
          {sync === 'map-stale' && (
            <div className="syncbar"><AlertTriangle /><span className="grow"><b>The document was edited.</b> The map may not reflect it yet.</span><button className="btn sm" onClick={updateMap}><RefreshCw />Update map</button></div>
          )}

          <div className="pane-body" style={{ display: 'flex', flexDirection: 'column' }}>
            {view !== 'doc' && (
              <div className="map-wrap" style={{ overflow: 'auto', borderBottom: view === 'split' ? '1px solid var(--rule)' : 0, flex: view === 'map' ? 1 : 'none' }}>
                <div style={{ padding: 16 }}>
                  <div style={{ border: '1px solid var(--rule)', borderRadius: 8, width: 'max-content', background: 'var(--sheet)' }}>
                    <Swimlane lanes={LANES} nodes={nodes} edges={edges} offsets={offsets} onMove={onMove} editable={!locked}
                      selected={sel} onSelect={(x) => { setSel(x); if (x) { setSelEdge(null); setPanel('edit') } }}
                      selectedEdge={selEdge} onSelectEdge={locked ? undefined : (x) => { setSelEdge(x); if (x) { setSel(null); setPanel('edit') } }}
                      changed={changed} />
                  </div>
                  <div style={{ marginTop: 12 }}><MapLegend /></div>
                </div>
              </div>
            )}
            {view !== 'map' && (
              <div style={{ background: 'var(--sheet)' }}>
                <ProcessDoc doc={doc} steps={steps} editable={!locked} onEditField={editField} changed={changed} version={proc.version} status={status === 'returned' ? 'returned' : status === 'review' ? 'under review' : 'draft'} />
              </div>
            )}
          </div>
        </section>
      </div>

      {dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} unsaved={save === 'dirty'} versions={versions} />}
      {dialog === 'submit' && <SubmitDialog onClose={() => setDialog(null)} supervisor={proc.supervisor} version={proc.version} openQuestions={doc.exceptions ? 0 : 1}
        onDone={() => { setDialog(null); setStatus('review'); toast(`Submitted to ${proc.supervisor}`); nav('/home') }} />}
      {dialog === 'approve' && <ApproveDialog onClose={() => setDialog(null)} author={proc.creator} version={proc.version} dept={proc.dept} blocked={!!sync}
        onDone={() => { setDialog(null); toast(`v${proc.version} approved and published`); nav(`/process/${proc.id}?approved=1`) }} />}
      {dialog === 'return' && <ReturnDialog onClose={() => setDialog(null)} author={proc.creator}
        onDone={() => { setDialog(null); toast(`Returned to ${proc.creator}`); nav('/reviews') }} />}
    </>
  )
}

function SaveState({ s }) {
  if (s === 'saving') return <span className="save"><Loader2 className="spin" />Saving…</span>
  if (s === 'dirty') return <span className="save warn"><AlertTriangle />Unsaved changes</span>
  return <span className="save"><CheckCircle2 />Saved · Nov 16, 3:42 PM</span>
}

/* ── AI revision (voice or text), applied to both outputs ── */
function AIPanel({ review, onApply }) {
  const [msgs, setMsgs] = useState(review ? [
    { who: 'ai', text: 'This submission has 14 steps across 4 roles. Tell me what to change — by voice or text — and I’ll update the map and document together.' },
  ] : [
    { who: 'ai', text: 'Ask for a change in plain language, for example “Move the dean sign-off before the chair review” or “Add what happens if the portal rejects the submission”.' },
  ])
  const [txt, setTxt] = useState('')
  const [voice, setVoice] = useState(false)
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)

  const ask = (t) => {
    if (!t.trim()) return
    setMsgs((m) => [...m, { who: 'me', via: voice ? 'voice' : 'text', text: t }])
    setTxt(''); setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setPending({
        summary: 'Rename the Dean step and add a portal-rejection exception.',
        node: { id: 'n12', from: 'Dean sign-off', label: 'Dean approval in Cayuse' },
        field: { k: 'exceptions', v: 'If the sponsor portal rejects the submission, the SPO corrects the errors and resubmits before the deadline; if the deadline passes, the PI is notified.' },
      })
    }, 1000)
  }

  return (
    <div className="stack" style={{ height: '100%' }}>
      <div className="convo grow" style={{ padding: 16, gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.who}`}>
            <span className="msg-meta">{m.who === 'ai' ? <><Sparkles />Process assistant</> : <>{m.via === 'voice' ? <Mic /> : <MessageSquareText />}You</>}</span>
            <div className="msg-body">{m.text}</div>
          </div>
        ))}
        {busy && <div className="msg ai"><div className="msg-body row gap2 muted"><Loader2 size={14} className="spin" />Working out the change…</div></div>}
        {pending && (
          <div className="card" style={{ background: 'var(--sheet-raised)', borderColor: 'color-mix(in srgb, var(--navy) 30%, transparent)' }}>
            <div className="card-head" style={{ padding: '10px 14px' }}><h3>Proposed revision</h3><span className="hint">Applies to both outputs</span></div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="small">{pending.summary}</p>
              <div className="stack gap2 small">
                <span className="row gap2"><Workflow size={14} color="var(--ink-3)" /><span className="muted" style={{ textDecoration: 'line-through' }}>{pending.node.from}</span><ArrowRight size={12} /><b style={{ fontWeight: 500 }}>{pending.node.label}</b></span>
                <span className="row gap2" style={{ alignItems: 'flex-start' }}><FileText size={14} color="var(--ink-3)" style={{ marginTop: 2 }} /><span>Exceptions: <span className="ink2">{pending.field.v}</span></span></span>
              </div>
              <div className="row gap2">
                <button className="btn sm primary" onClick={() => { onApply(pending); setPending(null); setMsgs((m) => [...m, { who: 'ai', text: 'Applied to the map and the document. Changed items are marked.' }]) }}>Apply to map & document</button>
                <button className="btn sm ghost" onClick={() => { setPending(null); setMsgs((m) => [...m, { who: 'ai', text: 'Discarded — nothing changed.' }]) }}>Discard</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="pane-foot" style={{ position: 'sticky', bottom: 0 }}>
        {voice ? (
          <div className="stack gap2">
            <div className="composer-box" style={{ minHeight: 70 }}>
              <span className="row gap2 small" style={{ color: 'var(--navy)' }}><span className="meter">{[0, 1, 2, 3].map((k) => <i key={k} style={{ animationDelay: `${k * 120}ms` }} />)}</span>Listening…</span>
              <span className="small">Rename dean sign-off to dean approval in Cayuse and add what happens if the portal rejects it<span className="live-caret" /></span>
            </div>
            <div className="row spread"><button className="btn sm ghost" onClick={() => setVoice(false)}>Type instead</button><button className="btn sm primary" onClick={() => { ask('Rename dean sign-off to dean approval in Cayuse and add what happens if the portal rejects it'); setVoice(false) }}><Send />Send</button></div>
          </div>
        ) : (
          <div className="composer-box">
            <textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={review ? 'Describe the revision you want…' : 'Ask for a change…'} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(txt) } }} aria-label="Revision request" />
            <div className="row spread">
              <button className="btn ghost sm" onClick={() => setVoice(true)}><Mic />Speak</button>
              <button className="btn primary sm" onClick={() => ask(txt)} disabled={!txt.trim()}><Wand2 />Revise</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── manual map editing: label, type, connections (SOW 3.8) ── */
function Inspector({ nodes, edges, sel, selEdge, setSel, setSelEdge, relabel, retype, setEdge, delEdge, addEdge }) {
  const node = nodes.find((n) => n.id === sel)
  const edge = edges.find((e) => e.id === selEdge)
  const lbl = (id) => nodes.find((n) => n.id === id)?.label
  const [newTo, setNewTo] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [draftLabel, setDraftLabel] = useState('')
  useEffect(() => { setDraftLabel(node?.label || '') }, [node?.id, node?.label])

  if (edge) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="eyebrow">Connection</span>
        <div className="row gap2 small" style={{ flexWrap: 'wrap' }}><span className="chip">{lbl(edge.from)}</span><ArrowRight size={13} /><span className="chip">{lbl(edge.to)}</span></div>
        <div className="field"><label>Connects to</label>
          <select className="select" value={edge.to} onChange={(e) => setEdge(edge.id, { to: e.target.value })}>
            {nodes.filter((n) => n.id !== edge.from).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </div>
        <div className="field"><label>Branch label</label><input className="input" value={edge.label || ''} onChange={(e) => setEdge(edge.id, { label: e.target.value })} placeholder="e.g. Yes, No, Revise" /></div>
        <button className="btn danger" onClick={() => delEdge(edge.id)}><Trash2 />Remove connection</button>
      </div>
    )
  }

  if (!node) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="notice info"><Info /><span>Select a step or a connection on the map to edit it. Drag steps to reposition them, then use Auto layout to tidy up.</span></div>
        <span className="hint">Supported manual edits: step labels, step type (step, decision, endpoint) and connections. Adding or deleting steps and lanes is done through the AI assistant.</span>
        <div className="stack" style={{ gap: 2 }}>
          {nodes.filter((n) => n.type !== 'parallel').map((n) => (
            <button key={n.id} className="nav-item" style={{ border: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => setSel(n.id)}>
              <span className="mono muted" style={{ width: 28 }}>{n.id.toUpperCase()}</span>{n.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const outs = edges.filter((e) => e.from === node.id)
  const fixed = node.type === 'start' || node.type === 'parallel'
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="row spread"><span className="eyebrow">Step <span className="mono">{node.id.toUpperCase()}</span></span><button className="btn ghost sm" onClick={() => setSel(null)}>Done</button></div>
      <div className="field">
        <label htmlFor="lbl">Label</label>
        <input id="lbl" className="input" value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} onBlur={() => draftLabel !== node.label && relabel(node.id, draftLabel)} onKeyDown={(e) => e.key === 'Enter' && relabel(node.id, draftLabel)} />
      </div>
      <div className="field">
        <label>Type</label>
        {fixed ? <span className="hint">{node.type === 'start' ? 'Trigger' : 'Parallel gateway'} — change through the AI assistant.</span> : (
          <div className="seg" style={{ alignSelf: 'flex-start' }}>
            {[['task', 'Step'], ['decision', 'Decision'], ['end', 'Endpoint']].map(([k, l]) => <button key={k} className={node.type === k ? 'on' : ''} onClick={() => retype(node.id, k)}>{l}</button>)}
          </div>
        )}
      </div>
      <div className="field">
        <label>Connections out</label>
        <div className="stack gap1">
          {outs.length === 0 && <span className="hint">None — this step ends a path.</span>}
          {outs.map((e) => (
            <div key={e.id} className="row gap2" style={{ padding: '6px 8px', border: '1px solid var(--rule-soft)', borderRadius: 4, background: 'var(--sheet)' }}>
              <ArrowRight size={13} color="var(--ink-3)" />
              <select className="select" style={{ padding: '4px 26px 4px 8px', background: 'transparent', border: 0 }} value={e.to} onChange={(ev) => setEdge(e.id, { to: ev.target.value })} aria-label="Target">
                {nodes.filter((n) => n.id !== node.id).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
              {e.label && <span className="chip">{e.label}</span>}
              <button className="btn ghost sm icon" onClick={() => delEdge(e.id)} aria-label="Remove connection"><Trash2 /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Add connection</label>
        <select className="select" value={newTo} onChange={(e) => setNewTo(e.target.value)}>
          <option value="">Choose a step…</option>
          {nodes.filter((n) => n.id !== node.id).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        {node.type === 'decision' && <input className="input" placeholder="Branch label (e.g. No)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />}
        <button className="btn sm" style={{ alignSelf: 'flex-start' }} disabled={!newTo} onClick={() => { addEdge(node.id, newTo, newLabel); setNewTo(''); setNewLabel('') }}><Plus />Add</button>
      </div>
      <div className="hint">Connections into this step: {edges.filter((e) => e.to === node.id).map((e) => lbl(e.from)).join(', ') || 'none'}</div>
    </div>
  )
}

function SourcesPanel() {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="stack gap2">
        <span className="eyebrow">Original documents</span>
        {[['OSP_PreAward_Procedures_2025.pdf', 'pdf', '38 pages'], ['Routing_checklist.xlsx', 'xls', '2 sheets']].map(([n, e, m]) => (
          <div key={n} className="file"><FileIcon ext={e} /><div className="stack" style={{ gap: 2, minWidth: 0 }}><span className="small" style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span><span className="hint">{m}</span></div><button className="btn ghost sm icon" aria-label="Open"><Eye /></button></div>
        ))}
      </div>
      <div className="stack gap2">
        <span className="eyebrow">Extracted information used</span>
        <div className="card">
          {[['§ 4.2 Eligibility review', 'Confirmed as extracted'], ['§ 4.3 Routing timeline', 'Corrected by author: “5 business days”'], ['§ 4.4 Compliance forms', 'Corrected by author: “Cayuse SP”, “IRB protocol numbers”'], ['Dean threshold conflict', 'Author chose: document ($250k threshold)'], ['Page 14', 'Unreadable — excluded']].map(([a, b], i) => (
            <div key={a} className="list-row" style={{ padding: '9px 12px', alignItems: 'flex-start' }}>
              <div className="stack" style={{ gap: 1 }}><span className="small" style={{ fontWeight: 500 }}>{a}</span><span className="hint" style={{ color: i === 4 ? 'var(--returned)' : undefined }}>{b}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="stack gap2">
        <span className="eyebrow">Capture conversation</span>
        <div className="card card-pad small ink2" style={{ padding: 12 }}>12 messages · 4 min 20 s of transcribed voice. <a href="#t">Read transcript</a></div>
      </div>
    </div>
  )
}
