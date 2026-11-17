import { useState } from 'react'
import { Download, AlertTriangle, Loader2, Check, Lock, Send, BadgeCheck, CornerUpLeft, Mail, Bell, Workflow, FileText } from 'lucide-react'
import { Modal, useToast } from './ui'

export function ExportDialog({ onClose, unsaved, versions }) {
  const toast = useToast()
  const [map, setMap] = useState({ pdf: true, png: false })
  const [doc, setDoc] = useState({ pdf: true, docx: false })
  const [ver, setVer] = useState(versions[0].id)
  const [state, setState] = useState('idle') // idle | working | failed
  const any = map.pdf || map.png || doc.pdf || doc.docx

  const go = () => {
    setState('working')
    setTimeout(() => { setState('idle'); onClose(); toast(`Exported ${versions.find((v) => v.id === ver).label}`) }, 1100)
  }

  return (
    <Modal title="Export process" sub="Exports reflect exactly one saved version of the map and document." onClose={onClose}
      foot={<>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        {state === 'failed' ? <button className="btn primary" onClick={go}>Retry export</button>
          : <button className="btn primary" disabled={!any || state === 'working'} onClick={go}>{state === 'working' ? <><Loader2 className="spin" />Preparing files…</> : <><Download />Export</>}</button>}
      </>}>
      {unsaved && (
        <div className="notice warn"><AlertTriangle />
          <div className="stack gap2"><span><b>You have unsaved changes.</b> Export uses the last saved version (saved 3:42 PM). Unsaved edits won’t be included.</span>
            <div><button className="btn sm">Save first, then export</button></div></div>
        </div>
      )}
      <div className="field">
        <label>Version</label>
        <select className="select" value={ver} onChange={(e) => setVer(e.target.value)}>
          {versions.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </div>
      <div className="grid-2" style={{ gap: 12 }}>
        <div className="card card-pad stack gap2" style={{ padding: 14 }}>
          <span className="row gap2" style={{ fontWeight: 600 }}><Workflow size={15} />Swimlane map</span>
          <label className="check"><input type="checkbox" checked={map.pdf} onChange={(e) => setMap({ ...map, pdf: e.target.checked })} />PDF</label>
          <label className="check"><input type="checkbox" checked={map.png} onChange={(e) => setMap({ ...map, png: e.target.checked })} />PNG image</label>
        </div>
        <div className="card card-pad stack gap2" style={{ padding: 14 }}>
          <span className="row gap2" style={{ fontWeight: 600 }}><FileText size={15} />Written document</span>
          <label className="check"><input type="checkbox" checked={doc.pdf} onChange={(e) => setDoc({ ...doc, pdf: e.target.checked })} />PDF</label>
          <label className="check"><input type="checkbox" checked={doc.docx} onChange={(e) => setDoc({ ...doc, docx: e.target.checked })} />Word (DOCX)</label>
        </div>
      </div>
      {state === 'failed' && <div className="notice err"><AlertTriangle /><span>The export didn’t finish, so no file was downloaded. Try again.</span></div>}
      <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => setState('failed')}>Design state: show export failure</button>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Modal>
  )
}

/* one action per revision: the button locks immediately (EC-07) */
function useOnce(fn) {
  const [busy, setBusy] = useState(false)
  return [busy, () => { if (busy) return; setBusy(true); setTimeout(fn, 900) }]
}

export function SubmitDialog({ onClose, onDone, supervisor, openQuestions = 0, version }) {
  const [busy, run] = useOnce(onDone)
  return (
    <Modal title="Submit for review" sub={`v${version} of the map and document go to your supervisor together.`} onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button><button className="btn primary" disabled={busy} onClick={run}>{busy ? <><Loader2 className="spin" />Submitting…</> : <><Send />Submit to {supervisor}</>}</button></>}>
      <div className="card">
        {[['Swimlane map', '14 steps across 4 roles'], ['Written document', '12 of 12 fields described'], ['Source documents', '2 attached · extracted content confirmed']].map(([a, b]) => (
          <div key={a} className="list-row" style={{ padding: '10px 14px' }}><Check size={15} color="var(--approved)" /><span className="grow">{a}</span><span className="hint">{b}</span></div>
        ))}
      </div>
      {openQuestions > 0 && <div className="notice warn"><AlertTriangle /><span>{openQuestions} question is still open. Your supervisor will see it as not yet described.</span></div>}
      <div className="notice info"><Lock /><span>While it’s under review you can view the process but not edit it. {supervisor} is notified by email and in the app.</span></div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Modal>
  )
}

export function ApproveDialog({ onClose, onDone, author, version, dept, blocked }) {
  const [busy, run] = useOnce(onDone)
  const [note, setNote] = useState('')
  return (
    <Modal title={`Approve v${version}`} sub="The map and document are approved together as one locked version." onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button><button className="btn primary" disabled={busy || blocked} onClick={run}>{busy ? <><Loader2 className="spin" />Approving…</> : <><BadgeCheck />Approve and publish</>}</button></>}>
      {blocked && <div className="notice err"><AlertTriangle /><span><b>The map and document don’t match.</b> Update the document from the map before approving. Mismatched pairs can’t be approved.</span></div>}
      <div className="stack gap2 small ink2">
        <span className="row gap2"><Lock size={14} />v{version} becomes read-only. Future changes start a new draft.</span>
        <span className="row gap2"><BadgeCheck size={14} />Published to the {dept} library for permitted viewers.</span>
        <span className="row gap2"><Mail size={14} />{author} is notified by email and in the app, with your note.</span>
      </div>
      <div className="field"><label>Note to {author} <span className="hint">(optional)</span></label><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Thanks — I clarified the Dean threshold before approving." /></div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Modal>
  )
}

export function ReturnDialog({ onClose, onDone, author }) {
  const [txt, setTxt] = useState('')
  const [busy, run] = useOnce(onDone)
  return (
    <Modal title="Return for corrections" sub={`${author} can edit and resubmit. Your revisions so far are kept.`} onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!txt.trim() || busy} onClick={run}>{busy ? <><Loader2 className="spin" />Returning…</> : <><CornerUpLeft />Return to {author.split(' ')[0]}</>}</button></>}>
      <div className="field">
        <label>What needs to change?</label>
        <textarea className="textarea" rows={5} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Be specific about the steps or fields to correct." />
        <span className="hint row gap1" style={{ gap: 6 }}><Bell size={12} />Sent by email and in-app with the review outcome.</span>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Modal>
  )
}
