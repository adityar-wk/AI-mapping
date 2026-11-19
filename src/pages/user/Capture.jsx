import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mic, MessageSquareText, Square, Pause, Paperclip, Sparkles, AlertTriangle,
  CheckCircle2, Loader2, X, MicOff, ArrowUp, Users, Flag, GitBranch, Repeat, Split, CircleStop, Server, HelpCircle, FileSearch,
  ChevronRight, CornerDownRight, Workflow,
} from 'lucide-react'
import { Topbar } from '../../App'
import { FileIcon, Modal } from '../../components/ui'
import { fmtTime } from '../../data'

/* ── upload rules (SOW 3.2) ── */
const ALLOWED = ['pdf', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']
const MAX_MB = 25
const MAX_FILES = 10
const extOf = (name) => (name.split('.').pop() || '').toLowerCase()
const fmtSize = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`)

/* ── the AI's questions, asked one at a time above the composer ── */
const Q_ORDER = { q: 'After eligibility, is the budget drafted before the compliance forms, or at the same time?', kind: 'Sequence', options: ['At the same time', 'Budget first, then compliance forms', 'Compliance forms first'] }
const Q_SIGNOFF = { q: 'Who gives final sign-off before the proposal goes to the sponsor?', kind: 'Responsibility', options: ['The Dean, for every proposal', 'The Dean, only above a budget threshold', 'Someone else'] }
const Q_REJECT = { q: 'What happens if the sponsor portal rejects the submission?', kind: 'Exception', options: ['The officer fixes it and resubmits', 'The PI is notified and it stops there'] }
const Q_WRAP = { q: 'Is there anything else in this process, or have we covered everything?', kind: 'Wrap-up', options: ['That’s everything', 'I have more to add'], wrap: true }

/* questions are asked inside the thread; once answered they stay in the history as an AI turn */
const SEED = [
  { who: 'ai', text: 'Let’s document a process. In your own words, what is the process called and what usually kicks it off?' },
  { who: 'me', via: 'voice', text: 'It’s our grant pre-award routing. It starts when a PI finds a funding opportunity and sends us an intent to apply.' },
  { who: 'ai', text: 'Got it — the trigger is a PI identifying a funding opportunity. Who checks eligibility, and what happens if the opportunity isn’t eligible?' },
  {
    who: 'me', via: 'text', text: 'The Sponsored Programs Officer checks eligibility and the deadline. If it isn’t eligible we tell the PI and it stops there. Our procedures doc is attached.',
    attach: [{ name: 'OSP_PreAward_Procedures_2025.pdf', ext: 'pdf', size: '4.2 MB · 38 pages', state: 'review' }],
  },
  { who: 'ai', text: 'Thanks. I’ve added a decision “Eligible?” with a “No” branch that ends the process. I’m reading your procedures document — 3 sections need your check before I use them.' },
]

const SEGMENTS = [
  { text: 'After it’s eligible the PI drafts the budget and narrative,' },
  { text: 'and at the same time our officer prepares the compliance forms in Kayuse.', flag: 'Kayuse', fix: 'Cayuse' },
  { text: 'Then the department chair reviews the whole package.' },
  { text: 'If the chair wants changes it goes back to the PI to revise the budget' },
]

/*
  What has been captured, rebuilt from the conversation state. In production the model returns this
  structure after each turn; here it follows the scripted turns and the answers actually given,
  so the side panel and the summary never show anything the person hasn't said.
*/
function captured(stage, answers, skipped) {
  const c = {
    Roles: ['Principal Investigator', 'Sponsored Programs Officer'],
    Trigger: ['PI identifies a funding opportunity'],
    Steps: ['Submit intent to apply', 'Review eligibility and deadline'],
    Decisions: ['Eligible? (Yes / No)'],
    Parallel: [], Loops: [],
    Endpoints: ['Not eligible — PI notified'],
    Systems: [],
    'Not yet described': skipped.map((q) => ({ [Q_SIGNOFF.q]: 'Final sign-off', [Q_REJECT.q]: 'Portal rejection' }[q] || q)),
  }
  if (stage === 'order') return c
  const par = /same time|parallel/i.test(answers.Sequence || '')
  c.Roles.push('Department Chair')
  c.Steps.push('Draft budget and narrative', 'Prepare compliance forms', 'Review proposal package')
  c.Decisions.push('Chair approves? (Yes / Revise)')
  if (par) c.Parallel.push('Budget ∥ compliance forms')
  c.Loops.push('Revise → Draft budget')
  c.Systems.push('Cayuse SP')
  if (stage === 'details') return c
  const so = answers.Responsibility
  if (so && /dean/i.test(so)) {
    c.Roles.push('Dean')
    if (/threshold/i.test(so)) { c.Decisions.push('Above budget threshold?'); c.Steps.push('Dean sign-off (above threshold)') } else c.Steps.push('Dean sign-off')
  } else if (so) c.Steps.push(`Final sign-off: ${so}`)
  c.Steps.push('Submit through sponsor portal')
  c.Systems.push('Sponsor portal')
  const rj = answers.Exception
  if (rj && /resubmit|fix/i.test(rj)) c.Loops.push('Portal rejects → correct and resubmit')
  else if (rj) c.Endpoints.push('Portal rejected — PI notified')
  c.Endpoints.push('Proposal submitted')
  return c
}

const isDone = (t) => /everything|that'?’?s all|done|nothing else|covered/i.test(t)

export default function Capture() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const startTyping = params.get('mode') === 'text'
  const [msgs, setMsgs] = useState(SEED)
  const [segs, setSegs] = useState(startTyping ? [] : SEGMENTS)
  const [rec, setRec] = useState(startTyping ? 'stopped' : 'recording') // recording | paused | stopped
  const [micDenied, setMicDenied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [files, setFiles] = useState([]) // attached to the next message
  const [thinking, setThinking] = useState(false)
  const [title, setTitle] = useState('Grant pre-award proposal routing')
  const [confirmGen, setConfirmGen] = useState(false)
  const [ask, setAsk] = useState({ list: [Q_ORDER], i: 0 }) // current question set, or null
  const [stage, setStage] = useState('order') // order | details | wrap | more | done
  const [skipped, setSkipped] = useState([])
  const [answers, setAnswers] = useState({}) // question kind → the person's answer
  const [savedAt, setSavedAt] = useState(() => new Date())
  const skippedRef = useRef([])
  const end = useRef(null)
  const fileInput = useRef(null)
  // keep the latest message in view, including when the question card or file chips change the dock's height
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, thinking, ask, files.length])

  const done = stage === 'done'
  const current = ask ? ask.list[ask.i] : null
  const unconfirmedDocs = msgs.reduce((n, m) => n + (m.attach?.filter((f) => f.state === 'review').length || 0), 0)
  const cap = captured(stage, answers, skipped)

  const aiSay = (m) => setMsgs((x) => [...x, { who: 'ai', ...m }])

  /* the assistant's next turn, after an answer (or a skip) */
  const advance = (text) => {
    if (ask && ask.i + 1 < ask.list.length) { setAsk({ ...ask, i: ask.i + 1 }); return }
    setAsk(null)
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      if (stage === 'order') {
        const par = /same time|parallel/i.test(text)
        aiSay({ text: `Understood — ${par ? 'the budget and compliance forms run in parallel' : `“${text}”, so I’ve kept them in sequence`}, then the chair reviews the package as a decision with a “Revise” loop back to the budget. Two more things I need:` })
        setAsk({ list: [Q_SIGNOFF, Q_REJECT], i: 0 }); setStage('details')
      } else if (stage === 'details') {
        const got = [Q_SIGNOFF, Q_REJECT].filter((q) => !skippedRef.current.includes(q.q))
        const said = { [Q_SIGNOFF.q]: 'the final sign-off', [Q_REJECT.q]: 'what happens when the portal rejects a submission' }
        aiSay({ text: got.length ? `Thanks — I’ve added ${got.map((q) => said[q.q]).join(' and ')}.` : 'No problem — I’ll leave those as open items.' })
        setAsk({ list: [Q_WRAP], i: 0 }); setStage('wrap')
      } else if (stage === 'wrap' && isDone(text)) {
        aiSay({ done: true, text: 'That covers the process end to end. Here’s what I captured — check it, then generate the swimlane map and the written document.' })
        setStage('done')
      } else if (stage === 'wrap') {
        aiSay({ text: 'Go ahead — tell me what else happens, step by step. I’ll ask if anything is unclear.' })
        setStage('more')
      } else {
        aiSay({ text: 'Added. I’ll place it in the flow.' })
        setAsk({ list: [Q_WRAP], i: 0 }); setStage('wrap')
      }
    }, 900)
  }

  const post = (text, via) => {
    const ok = files.filter((f) => !f.err)
    if (!text.trim() && !ok.length) return
    const attach = ok.map((f) => ({ ...f, state: 'processing' }))
    const q = text.trim() && current && !thinking ? [{ who: 'ai', text: current.q, kind: current.kind }] : []
    if (q.length) setAnswers((a) => ({ ...a, [current.kind]: text.trim() }))
    setSavedAt(new Date())
    const idx = msgs.length + q.length
    setMsgs((m) => [...m, ...q, { who: 'me', via, text, attach: attach.length ? attach : undefined }])
    setDraft(''); setFiles([])
    if (attach.length) {
      setTimeout(() => setMsgs((m) => m.map((x, j) => (j === idx ? { ...x, attach: x.attach.map((f) => ({ ...f, state: 'done' })) } : x))), 2200)
    }
    if (text.trim()) {
      if (stage === 'done') setStage('more') // added more after finishing — reopen
      advance(text)
    } else {
      setThinking(true)
      setTimeout(() => { setThinking(false); aiSay({ text: `Thanks — I’m extracting text from ${attach.length === 1 ? 'that file' : `${attach.length} files`}. I’ll only use content you confirm.` }) }, 800)
    }
  }

  const choose = (opt) => post(opt, 'choice')
  const skip = () => {
    skippedRef.current = [...skippedRef.current, current.q]
    setSkipped(skippedRef.current)
    setMsgs((m) => [...m, { who: 'ai', text: current.q, kind: current.kind }, { who: 'skip', text: current.q }])
    advance('')
  }

  const hasVoice = segs.length > 0
  const validFiles = files.filter((f) => !f.err).length
  const canSend = hasVoice ? !editing : !!draft.trim() || validFiles > 0
  const send = () => {
    if (!canSend) return
    if (hasVoice) {
      const text = [segs.map((x) => x.text).join(' '), draft.trim()].filter(Boolean).join(' ')
      setRec('stopped'); setSegs([]); setEditing(false)
      post(text, 'voice')
    } else post(draft, 'text')
  }
  const startMic = () => {
    if (micDenied) return
    setRec('recording')
    if (!segs.length) setSegs([{ text: 'Then the dean signs off' }])
  }
  const stopMic = () => setRec('stopped')
  const discard = () => { setSegs([]); setRec('stopped'); setEditing(false) }

  const transcript = segs.map((x) => x.text).join(' ')
  const flagged = segs.find((x) => x.flag)
  const applyFix = () => setSegs((x) => x.map((y) => (y.flag ? { text: y.text.replace(y.flag, y.fix) } : y)))

  const pickFiles = (list) => {
    const already = msgs.reduce((n, m) => n + (m.attach?.length || 0), 0) + validFiles
    const next = [...list].map((f, k) => {
      const ext = extOf(f.name)
      let err = null
      if (!ALLOWED.includes(ext)) err = `.${ext || '?'} files can’t be uploaded. Use PDF, DOCX, XLS, PNG or JPG.`
      else if (f.size > MAX_MB * 1e6) err = `Over the ${MAX_MB} MB limit. Compress or split it and try again.`
      else if (already + k + 1 > MAX_FILES) err = `A process can have up to ${MAX_FILES} files.`
      return { name: f.name, ext: ext === 'jpeg' ? 'jpg' : ext === 'xlsx' ? 'xls' : ext, size: fmtSize(f.size), err }
    })
    setFiles((x) => [...x, ...next])
  }

  return (
    <>
      <Topbar wide crumbs={[{ label: 'My processes', to: '/home' }, { label: 'New process' }]}>
        <span className="save"><CheckCircle2 />Draft saved {fmtTime(savedAt)}</span>
        <button className="btn" onClick={() => nav('/home')}>Save & exit</button>
        <span data-tip={done ? undefined : 'Available once you’ve covered every step'}>
          <button className="btn primary" disabled={!done} onClick={() => setConfirmGen(true)}><Sparkles />Generate map & document</button>
        </span>
      </Topbar>

      <div className="workspace" style={{ gridTemplateColumns: '1fr minmax(320px, 360px)' }}>
        {/* ── conversation ── */}
        <section className="pane chat-pane" aria-label="Conversation">
          <div className="pane-head">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Process name" style={{ background: 'transparent', border: 0, fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600, padding: '2px 0', maxWidth: 520 }} />
          </div>

          <div className="pane-body">
            <div className="convo chat">
              {msgs.map((m, i) => (m.who === 'skip' ? (
                <div key={i} className="skip-line"><CornerDownRight size={13} />Skipped “{m.text}” — it’ll show as “not yet described”</div>
              ) : (
                <div key={i} className={`msg ${m.who}`}>
                  {m.who === 'ai'
                    ? <span className="msg-meta"><Sparkles />Process assistant{m.kind && <span className="q-kind">{m.kind}</span>}</span>
                    : <span className="msg-meta">{m.via === 'voice' ? <Mic /> : m.via === 'choice' ? <CheckCircle2 /> : <MessageSquareText />}{m.via === 'voice' ? 'Spoken' : m.via === 'choice' ? 'Answered' : 'Typed'}</span>}
                  {m.text && <div className="msg-body">{m.text}</div>}
                  {m.attach && (
                    <div className="msg-files">
                      {m.attach.map((f) => (
                        <div key={f.name} className="att">
                          <FileIcon ext={f.ext} />
                          <div className="stack" style={{ gap: 2, minWidth: 0 }}>
                            <span className="att-name">{f.name}</span>
                            {f.state === 'processing' && <span className="hint row gap1"><Loader2 size={11} className="spin" />Extracting text and layout…</span>}
                            {f.state === 'review' && <span className="hint" style={{ color: 'var(--returned)' }}>Extracted · 3 sections need your check</span>}
                            {f.state === 'done' && <span className="hint" style={{ color: 'var(--approved)' }}>Extracted · ready</span>}
                          </div>
                          {f.state === 'review' && <button className="btn sm" onClick={() => nav('/capture/p-104/extraction')}>Review<ChevronRight /></button>}
                        </div>
                      ))}
                    </div>
                  )}
                  {m.done && <DoneCard cap={cap} onGenerate={() => setConfirmGen(true)} />}
                </div>
              )))}
              {current && !thinking && (
                <div className="msg ai" role="group" aria-label="Question from the assistant">
                  <span className="msg-meta"><Sparkles />Process assistant<span className="q-kind">{current.kind}{ask.list.length > 1 && ` · ${ask.i + 1} of ${ask.list.length}`}</span></span>
                  <div className="msg-body">{current.q}</div>
                  <div className="q-opts">
                    {current.options.map((o) => <button key={o} className="q-opt" onClick={() => choose(o)}>{o}</button>)}
                    {!current.wrap && <button className="q-skip" onClick={skip}>Skip for now</button>}
                  </div>
                </div>
              )}
              {thinking && <div className="msg ai"><span className="msg-meta"><Sparkles />Process assistant</span><div className="msg-body row gap2 muted"><Loader2 size={14} className="spin" />Thinking…</div></div>}
              <div ref={end} />
            </div>
          </div>

          {/* ── composer: question card on top, one box for voice, text and files ── */}
          <div className="chat-dock">
            {micDenied && (
              <div className="notice warn" style={{ marginBottom: 10 }}>
                <MicOff />
                <div className="stack gap2 grow">
                  <span><b>Microphone access is blocked.</b> Your browser didn’t allow Process Atlas to use the microphone. Everything you’ve captured so far is saved, and you can keep typing.</span>
                  <div className="row gap2"><button className="btn sm ghost" onClick={() => setMicDenied(false)}>Try microphone again</button></div>
                </div>
              </div>
            )}

            <div className={`ai-composer ${rec === 'recording' && hasVoice ? 'rec' : ''}`}>
              {files.length > 0 && (
                <div className="comp-files">
                  {files.map((f, i) => (
                    <div key={i} className={`comp-file ${f.err ? 'err' : ''}`} title={f.err || f.name}>
                      <FileIcon ext={f.ext.slice(0, 4)} />
                      <div className="stack" style={{ gap: 1, minWidth: 0 }}>
                        <span className="att-name">{f.name}</span>
                        <span className="hint" style={f.err ? { color: 'var(--brick)' } : undefined}>{f.err || f.size}</span>
                      </div>
                      <button className="btn ghost sm icon" aria-label={`Remove ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}><X /></button>
                    </div>
                  ))}
                </div>
              )}

              {hasVoice && (
                <div className="ai-transcript">
                  <div className="ai-transcript-head">
                    {rec === 'recording'
                      ? <span className="row gap2" style={{ color: 'var(--navy)' }}><span className="meter" aria-label="Recording">{[0, 1, 2, 3, 4].map((k) => <i key={k} style={{ animationDelay: `${k * 120}ms` }} />)}</span>Listening · English</span>
                      : <span className="row gap2"><Mic size={14} />{rec === 'paused' ? 'Paused' : 'Review your words, then send'}</span>}
                    <span className="hint">{editing ? 'Press Enter when done' : 'Click the text to edit'}</span>
                  </div>
                  {editing ? (
                    <textarea className="tr-edit" autoFocus defaultValue={transcript} rows={4} aria-label="Edit transcript"
                      onBlur={(e) => { const v = e.target.value.trim(); setSegs(v ? [{ text: v }] : []); setEditing(false) }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() } }} />
                  ) : (
                    <p className="tr-para" onClick={() => { if (rec === 'recording') setRec('paused'); setEditing(true) }} title="Click to edit">
                      {segs.map((s, i) => (
                        <span key={i}>{i > 0 && ' '}{s.flag ? s.text.split(s.flag).flatMap((part, k) => (k ? [<mark key={k} className="tr-flag">{s.flag}</mark>, part] : [part])) : s.text}</span>
                      ))}
                      {rec === 'recording' && <span className="live-caret" />}
                    </p>
                  )}
                  {flagged && !editing && (
                    <span className="tr-fix"><AlertTriangle size={13} />Did you mean “{flagged.fix}”?<button className="btn sm" onClick={applyFix}>Use “{flagged.fix}”</button></span>
                  )}
                </div>
              )}

              <textarea className="ai-input" value={draft} onChange={(e) => setDraft(e.target.value)} rows={1}
                placeholder={hasVoice ? 'Add anything by typing…' : current ? 'Type your answer, or tap the mic…' : 'Describe a step, or tap the mic to talk…'}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} aria-label="Message" />

              <div className="ai-bar">
                <div className="row gap1">
                  <button className="btn ghost icon round-sm" aria-label="Attach documents" title="Attach documents — PDF, DOCX, XLS, PNG, JPG · up to 25 MB" onClick={() => fileInput.current?.click()}><Paperclip /></button>
                  <input ref={fileInput} type="file" multiple hidden accept=".pdf,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={(e) => { pickFiles(e.target.files); e.target.value = '' }} />
                  {hasVoice && rec !== 'recording' && <button className="btn ghost sm" onClick={discard}><X />Discard recording</button>}
                </div>
                <div className="row gap2">
                  {rec === 'recording' && hasVoice ? (
                    <>
                      <button className="btn ghost icon round-sm" onClick={() => setRec('paused')} aria-label="Pause" title="Pause"><Pause /></button>
                      <button className="ai-mic on" onClick={stopMic} aria-label="Stop recording" title="Stop recording"><Square /></button>
                    </>
                  ) : (
                    <button className="ai-mic" onClick={startMic} disabled={micDenied} aria-label={hasVoice ? 'Keep talking' : 'Talk'} title={micDenied ? 'Microphone blocked' : hasVoice ? 'Keep talking' : 'Talk'}>{micDenied ? <MicOff /> : <Mic />}</button>
                  )}
                  <button className="ai-send" onClick={send} disabled={!canSend} aria-label="Send" title="Send"><ArrowUp /></button>
                </div>
              </div>
            </div>
            <div className="chat-foot">
              <span>The AI records only what you tell it or what’s in your documents, and asks when something is missing.</span>
              <button className="linkish" onClick={() => setMicDenied((v) => !v)} title="Design state">{micDenied ? 'Restore mic' : 'Simulate mic blocked'}</button>
            </div>
          </div>
        </section>

        {/* ── captured structure ── */}
        <aside className="pane" aria-label="Captured so far" style={{ background: 'var(--paper)' }}>
          <div className="pane-head"><h3 style={{ fontFamily: 'var(--sans)' }}>Captured so far</h3><span className="hint">Updates as you talk</span></div>
          <div className="pane-body" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Structure cap={cap} />
          </div>
        </aside>
      </div>

      {confirmGen && (
        <Modal title="Generate map and document?" sub="Both outputs are created together from the same captured information." onClose={() => setConfirmGen(false)}
          foot={<><button className="btn ghost" onClick={() => setConfirmGen(false)}>Not yet</button><button className="btn primary" onClick={() => nav('/process/p-104/edit?generated=1')}><Sparkles />Generate</button></>}>
          {skipped.length > 0 && <div className="notice warn"><HelpCircle /><span><b>{skipped.length} question{skipped.length > 1 ? 's were' : ' was'} skipped.</b> Missing details will appear as “not yet described” in the document rather than being filled in.</span></div>}
          {unconfirmedDocs > 0 && <div className="notice info"><FileSearch /><span>{unconfirmedDocs} uploaded document{unconfirmedDocs > 1 ? 's have' : ' has'} extracted content you haven’t confirmed. Unconfirmed content won’t be used.</span></div>}
          {!skipped.length && !unconfirmedDocs && <div className="notice ok"><CheckCircle2 /><span>Every question is answered and all documents are confirmed.</span></div>}
        </Modal>
      )}
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

/* ── shown in the thread once the user confirms they've covered everything; counts come from the captured structure ── */
function DoneCard({ cap, onGenerate }) {
  const stats = ['Roles', 'Steps', 'Decisions', 'Loops', 'Parallel', 'Endpoints'].map((k) => [k, cap[k].length])
  const open = cap['Not yet described'].length
  return (
    <div className="done-card">
      <div className="done-stats">
        {stats.map(([k, v]) => <div key={k}><b className="num">{v}</b><span>{k}</span></div>)}
      </div>
      {open > 0 && <span className="small row gap2" style={{ color: 'var(--returned)' }}><HelpCircle size={13} />{open} skipped question{open > 1 ? 's' : ''} will show as “not yet described”</span>}
      <div className="row gap2 wrap">
        <button className="btn primary" onClick={onGenerate}><Workflow />Generate swimlane & document</button>
        <span className="hint">You can still add more — just keep typing.</span>
      </div>
    </div>
  )
}

const ROW_ICON = { Roles: Users, Trigger: Flag, Steps: CircleStop, Decisions: GitBranch, Parallel: Split, Loops: Repeat, Endpoints: CircleStop, Systems: Server, 'Not yet described': HelpCircle }

function Structure({ cap }) {
  const rows = Object.entries(cap).filter(([, items]) => items.length)
  return (
    <div className="card">
      {rows.map(([k, items], i) => {
        const I = ROW_ICON[k]
        return (
          <div key={k} className="row" style={{ alignItems: 'flex-start', padding: '10px 14px', borderTop: i ? '1px solid var(--rule-soft)' : 0, gap: 10 }}>
            <I size={14} color={k === 'Not yet described' ? 'var(--returned)' : 'var(--ink-3)'} style={{ marginTop: 3 }} />
            <div className="stack grow" style={{ gap: 4 }}>
              <span className="row spread"><span className="small" style={{ fontWeight: 600 }}>{k}</span><span className="hint num">{items.length}</span></span>
              <div className="row wrap" style={{ gap: 4 }}>{items.map((x) => <span key={x} className="chip">{x}</span>)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
