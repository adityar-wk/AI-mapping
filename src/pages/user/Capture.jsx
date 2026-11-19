import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mic, MessageSquareText, Square, Pause, RotateCcw, PenLine, Paperclip, Sparkles, AlertTriangle,
  CheckCircle2, Loader2, X, MicOff, ArrowUp, Users, Flag, GitBranch, Repeat, Split, CircleStop, Server, HelpCircle, FileSearch,
  ChevronRight, CornerDownRight, Workflow,
} from 'lucide-react'
import { Topbar } from '../../App'
import { FileIcon, Modal } from '../../components/ui'

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
  { t: '00:04', text: 'After it’s eligible the PI drafts the budget and narrative,' },
  { t: '00:09', text: 'and at the same time our officer prepares the compliance forms in Kayuse.', flag: 'Low confidence: “Kayuse” — did you mean “Cayuse”?' },
  { t: '00:15', text: 'Then the department chair reviews the whole package.' },
  { t: '00:19', text: 'If the chair wants changes it goes back to the PI to revise the budget', live: true },
]

const isDone = (t) => /everything|that'?’?s all|done|nothing else|covered/i.test(t)

export default function Capture() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const startTyping = params.get('mode') === 'text'
  const [msgs, setMsgs] = useState(SEED)
  const [segs, setSegs] = useState(startTyping ? [] : SEGMENTS)
  const [rec, setRec] = useState(startTyping ? 'stopped' : 'recording') // recording | paused | stopped
  const [micDenied, setMicDenied] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [rerec, setRerec] = useState(null)
  const [draft, setDraft] = useState('')
  const [files, setFiles] = useState([]) // attached to the next message
  const [thinking, setThinking] = useState(false)
  const [title, setTitle] = useState('Grant pre-award proposal routing')
  const [confirmGen, setConfirmGen] = useState(false)
  const [ask, setAsk] = useState({ list: [Q_ORDER], i: 0 }) // current question set, or null
  const [stage, setStage] = useState('order') // order | details | wrap | more | done
  const [skipped, setSkipped] = useState([])
  const skippedRef = useRef([])
  const end = useRef(null)
  const fileInput = useRef(null)
  // keep the latest message in view, including when the question card or file chips change the dock's height
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, thinking, ask, files.length])

  const done = stage === 'done'
  const current = ask ? ask.list[ask.i] : null
  const unconfirmedDocs = msgs.some((m) => m.attach?.some((f) => f.state === 'review'))

  const aiSay = (m) => setMsgs((x) => [...x, { who: 'ai', ...m }])

  /* the assistant's next turn, after an answer (or a skip) */
  const advance = (text) => {
    if (ask && ask.i + 1 < ask.list.length) { setAsk({ ...ask, i: ask.i + 1 }); return }
    setAsk(null)
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      if (stage === 'order') {
        aiSay({ text: 'Understood — the budget and compliance forms run in parallel, then the chair reviews the package as a decision with a “Revise” loop back to the budget. Two more things I need:' })
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
    const idx = msgs.length
    setMsgs((m) => [...m, { who: 'me', via, text, attach: attach.length ? attach : undefined }])
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
    setMsgs((m) => [...m, { who: 'skip', text: current.q }])
    advance('')
  }

  const hasVoice = segs.length > 0
  const validFiles = files.filter((f) => !f.err).length
  const canSend = hasVoice ? rerec === null : !!draft.trim() || validFiles > 0
  const send = () => {
    if (!canSend) return
    if (hasVoice) {
      const text = [segs.map((x) => x.text).join(' '), draft.trim()].filter(Boolean).join(' ')
      setRec('stopped'); setSegs([]); setEditIdx(null)
      post(text, 'voice')
    } else post(draft, 'text')
  }
  const startMic = () => {
    if (micDenied) return
    setRec('recording')
    if (!segs.length) setSegs([{ t: '00:00', text: 'Then the dean signs off', live: true }])
  }
  const stopMic = () => { setRec('stopped'); setSegs((x) => x.map((y) => ({ ...y, live: false }))) }
  const discard = () => { setSegs([]); setRec('stopped'); setEditIdx(null) }

  const doRerecord = (i) => {
    setRerec(i)
    setTimeout(() => {
      setSegs((s) => s.map((x, j) => (j === i ? { ...x, text: 'and at the same time our officer prepares the compliance forms in Cayuse.', flag: null } : x)))
      setRerec(null)
    }, 1600)
  }

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
        <span className="save"><CheckCircle2 />Draft saved 2 min ago</span>
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
                    ? <span className="msg-meta"><Sparkles />Process assistant</span>
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
                  {m.done && <DoneCard skipped={skipped.length} onGenerate={() => setConfirmGen(true)} />}
                </div>
              )))}
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

            {current && !thinking && (
              <div className="ask-card" role="group" aria-label="Question from the assistant">
                <div className="ask-head">
                  <span className="ask-kind"><HelpCircle size={13} />{current.kind}{ask.list.length > 1 && <span className="muted"> · {ask.i + 1} of {ask.list.length}</span>}</span>
                  {!current.wrap && <button className="btn ghost sm" onClick={skip}>Skip</button>}
                </div>
                <p className="ask-q">{current.q}</p>
                <div className="ask-opts">
                  {current.options.map((o, k) => (
                    <button key={o} className="ask-opt" onClick={() => choose(o)}><span className="ask-n">{k + 1}</span>{o}<ChevronRight className="ask-go" /></button>
                  ))}
                </div>
                <span className="ask-or">Or answer in your own words below — type or tap the mic</span>
              </div>
            )}

            <div className={`ai-composer ${rec === 'recording' && hasVoice ? 'rec' : ''} ${current && !thinking ? 'joined' : ''}`}>
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
                    <span className="hint">Click a line to fix it</span>
                  </div>
                  {segs.map((s, i) => (
                    <div key={i} className={`seg-line ${s.flag ? 'flag' : ''}`}>
                      <span className="t">{s.t}</span>
                      <div className="stack" style={{ gap: 4 }}>
                        {editIdx === i ? (
                          <textarea className="textarea" autoFocus defaultValue={s.text} rows={2} onBlur={(e) => { const v = e.target.value; setSegs((x) => x.map((y, j) => (j === i ? { ...y, text: v, flag: null } : y))); setEditIdx(null) }}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() } }} aria-label="Edit transcript line" />
                        ) : rerec === i ? (
                          <span className="row gap2" style={{ color: 'var(--navy)' }}><span className="meter">{[0, 1, 2].map((k) => <i key={k} style={{ animationDelay: `${k * 120}ms` }} />)}</span>Re-recording this part only…</span>
                        ) : (
                          <span className="seg-text" onClick={() => setEditIdx(i)}>{s.text}{s.live && rec === 'recording' && <span className="live-caret" />}</span>
                        )}
                        {s.flag && rerec !== i && editIdx !== i && (
                          <span className="small row" style={{ color: 'var(--returned)', gap: 6, flexWrap: 'wrap' }}><AlertTriangle size={13} />{s.flag}
                            <button className="btn sm" style={{ height: 24, padding: '0 10px' }} onClick={() => setSegs((x) => x.map((y, j) => (j === i ? { ...y, text: y.text.replace('Kayuse', 'Cayuse'), flag: null } : y)))}>Use “Cayuse”</button>
                          </span>
                        )}
                      </div>
                      <div className="acts">
                        <button className="btn ghost sm icon" title="Re-record this part" aria-label="Re-record this part" onClick={() => doRerecord(i)}><RotateCcw /></button>
                        <button className="btn ghost sm icon" title="Edit text" aria-label="Edit text" onClick={() => setEditIdx(i)}><PenLine /></button>
                      </div>
                    </div>
                  ))}
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
            <Structure />
          </div>
        </aside>
      </div>

      {confirmGen && (
        <Modal title="Generate map and document?" sub="Both outputs are created together from the same captured information." onClose={() => setConfirmGen(false)}
          foot={<><button className="btn ghost" onClick={() => setConfirmGen(false)}>Not yet</button><button className="btn primary" onClick={() => nav('/process/p-104/edit?generated=1')}><Sparkles />Generate</button></>}>
          {skipped.length > 0 && <div className="notice warn"><HelpCircle /><span><b>{skipped.length} question{skipped.length > 1 ? 's were' : ' was'} skipped.</b> Missing details will appear as “not yet described” in the document rather than being filled in.</span></div>}
          {unconfirmedDocs && <div className="notice info"><FileSearch /><span>1 uploaded document has extracted content you haven’t confirmed. Unconfirmed content won’t be used.</span></div>}
          {!skipped.length && !unconfirmedDocs && <div className="notice ok"><CheckCircle2 /><span>Every question is answered and all documents are confirmed.</span></div>}
        </Modal>
      )}
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

/* ── shown in the thread once the user confirms they've covered everything ── */
function DoneCard({ skipped, onGenerate }) {
  const stats = [['Roles', 4], ['Steps', 9], ['Decisions', 2], ['Loops', 1], ['Parallel', 1], ['Endpoints', 3]]
  return (
    <div className="done-card">
      <div className="done-stats">
        {stats.map(([k, v]) => <div key={k}><b className="num">{v}</b><span>{k}</span></div>)}
      </div>
      {skipped > 0 && <span className="small row gap2" style={{ color: 'var(--returned)' }}><HelpCircle size={13} />{skipped} skipped question{skipped > 1 ? 's' : ''} will show as “not yet described”</span>}
      <div className="row gap2 wrap">
        <button className="btn primary" onClick={onGenerate}><Workflow />Generate swimlane & document</button>
        <span className="hint">You can still add more — just keep typing.</span>
      </div>
    </div>
  )
}

function Structure() {
  const rows = [
    [Users, 'Roles', ['Principal Investigator', 'Sponsored Programs Officer', 'Department Chair']],
    [Flag, 'Trigger', ['PI identifies a funding opportunity']],
    [CircleStop, 'Steps', ['Submit intent to apply', 'Review eligibility and deadline', 'Draft budget and narrative', 'Prepare compliance forms', 'Review proposal package']],
    [GitBranch, 'Decisions', ['Eligible? (Yes / No)', 'Chair approves? (Yes / Revise)']],
    [Split, 'Parallel', ['Budget ∥ compliance forms']],
    [Repeat, 'Loops', ['Revise → Draft budget']],
    [CircleStop, 'Endpoints', ['Not eligible — PI notified']],
    [Server, 'Systems', ['Cayuse SP', 'Sponsor portal']],
  ]
  return (
    <div className="card">
      {rows.map(([I, k, items], i) => (
        <div key={k} className="row" style={{ alignItems: 'flex-start', padding: '10px 14px', borderTop: i ? '1px solid var(--rule-soft)' : 0, gap: 10 }}>
          <I size={14} color="var(--ink-3)" style={{ marginTop: 3 }} />
          <div className="stack grow" style={{ gap: 4 }}>
            <span className="row spread"><span className="small" style={{ fontWeight: 600 }}>{k}</span><span className="hint num">{items.length}</span></span>
            <div className="row wrap" style={{ gap: 4 }}>{items.map((x) => <span key={x} className="chip">{x}</span>)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
