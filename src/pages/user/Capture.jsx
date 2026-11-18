import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mic, MessageSquareText, Square, Pause, RotateCcw, PenLine, Send, Paperclip, Sparkles, AlertTriangle,
  CheckCircle2, Loader2, X, MicOff, ArrowUp, Users, Flag, GitBranch, Repeat, Split, CircleStop, Server, HelpCircle, FileSearch,
} from 'lucide-react'
import { Topbar } from '../../App'
import { FileIcon, Modal } from '../../components/ui'

const SEED = [
  { who: 'ai', text: 'Let’s document a process. In your own words, what is the process called and what usually kicks it off?' },
  { who: 'me', via: 'voice', text: 'It’s our grant pre-award routing. It starts when a PI finds a funding opportunity and sends us an intent to apply.' },
  { who: 'ai', text: 'Got it — the trigger is a PI identifying a funding opportunity. A few things I couldn’t tell yet:', qs: ['Who checks eligibility — you, or someone else in Sponsored Programs?', 'What happens if the opportunity is not eligible?'] },
  { who: 'me', via: 'text', text: 'The Sponsored Programs Officer checks eligibility and the deadline. If it isn’t eligible we tell the PI and it stops there.' },
  { who: 'ai', text: 'Thanks. I’ve added a decision “Eligible?” with a “No” branch that ends the process. After eligibility, does the budget get drafted before the compliance forms, or at the same time?' },
]

const SEGMENTS = [
  { t: '00:04', text: 'After it’s eligible the PI drafts the budget and narrative,' },
  { t: '00:09', text: 'and at the same time our officer prepares the compliance forms in Kayuse.', flag: 'Low confidence: “Kayuse” — did you mean “Cayuse”?' },
  { t: '00:15', text: 'Then the department chair reviews the whole package.' },
  { t: '00:19', text: 'If the chair wants changes it goes back to the PI to revise the budget', live: true },
]

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
  const [thinking, setThinking] = useState(false)
  const [title, setTitle] = useState('Grant pre-award proposal routing')
  const [confirmGen, setConfirmGen] = useState(false)
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, segs, thinking])

  const sendText = (text, via = 'text') => {
    if (!text.trim()) return
    setMsgs((m) => [...m, { who: 'me', via, text }])
    setDraft('')
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      setMsgs((m) => [...m, { who: 'ai', text: 'Understood — I’ve recorded the chair’s review as a decision with a “Revise” loop back to the PI’s budget step. Who gives final sign-off before submission to the sponsor?', qs: ['Is the Dean’s sign-off required for every proposal, or only above a budget threshold?'] }])
    }, 1100)
  }

  const hasVoice = segs.length > 0
  const canSend = hasVoice ? rerec === null : !!draft.trim()
  const send = () => {
    if (!canSend) return
    if (hasVoice) {
      const text = [segs.map((x) => x.text).join(' '), draft.trim()].filter(Boolean).join(' ')
      setRec('stopped'); setSegs([]); setEditIdx(null)
      sendText(text, 'voice')
    } else sendText(draft)
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

  return (
    <>
      <Topbar wide crumbs={[{ label: 'My processes', to: '/home' }, { label: 'New process' }]}>
        <span className="save"><CheckCircle2 />Draft saved 2 min ago</span>
        <button className="btn" onClick={() => nav('/home')}>Save & exit</button>
        <button className="btn primary" onClick={() => setConfirmGen(true)}><Sparkles />Generate map & document</button>
      </Topbar>

      <div className="workspace" style={{ gridTemplateColumns: '1fr minmax(340px, 400px)' }}>
        {/* ── conversation ── */}
        <section className="pane chat-pane" aria-label="Conversation">
          <div className="pane-head">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Process name" style={{ background: 'transparent', border: 0, fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600, padding: '2px 0', maxWidth: 520 }} />
          </div>

          <div className="pane-body">
            <div className="convo chat">
              {msgs.map((m, i) => (
                <div key={i} className={`msg ${m.who}`}>
                  {m.who === 'ai'
                    ? <span className="msg-meta"><Sparkles />Process assistant</span>
                    : <span className="msg-meta">{m.via === 'voice' ? <Mic /> : <MessageSquareText />}{m.via === 'voice' ? 'Spoken' : 'Typed'}</span>}
                  <div className="msg-body">
                    {m.text}
                    {m.qs && <ol className="qlist">{m.qs.map((q) => <li key={q}>{q}</li>)}</ol>}
                  </div>
                </div>
              ))}
              {thinking && <div className="msg ai"><span className="msg-meta"><Sparkles />Process assistant</span><div className="msg-body row gap2 muted"><Loader2 size={14} className="spin" />Reading your answer…</div></div>}
              <div ref={end} />
            </div>
          </div>

          {/* ── composer: one box for voice and text, like any AI chat ── */}
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
                placeholder={hasVoice ? 'Add anything by typing…' : 'Describe a step, answer a question, or tap the mic to talk…'}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} aria-label="Message" />

              <div className="ai-bar">
                <div className="row gap1">
                  <button className="btn ghost icon round-sm" aria-label="Attach documents" title="Attach documents"><Paperclip /></button>
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

        {/* ── captured structure + sources ── */}
        <aside className="pane" aria-label="Captured so far" style={{ background: 'var(--paper)' }}>
          <div className="pane-head"><h3 style={{ fontFamily: 'var(--sans)' }}>Captured so far</h3><span className="hint">Updates as you talk</span></div>
          <div className="pane-body" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Structure />
            <OpenQuestions />
            <Sources onReview={() => nav('/capture/p-104/extraction')} />
          </div>
        </aside>
      </div>

      {confirmGen && (
        <Modal title="Generate map and document?" sub="Both outputs are created together from the same captured information." onClose={() => setConfirmGen(false)}
          foot={<><button className="btn ghost" onClick={() => setConfirmGen(false)}>Keep describing</button><button className="btn primary" onClick={() => nav('/process/p-104/edit?generated=1')}><Sparkles />Generate</button></>}>
          <div className="notice warn"><HelpCircle /><span><b>2 questions are still open.</b> Missing details will appear as “not yet described” in the document rather than being filled in.</span></div>
          <div className="notice info"><FileSearch /><span>1 uploaded document has extracted content you haven’t confirmed. Unconfirmed content won’t be used.</span></div>
        </Modal>
      )}
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
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

function OpenQuestions() {
  return (
    <div className="card">
      <div className="card-head"><h3>Open questions</h3><span className="tag returned">2 open</span></div>
      <div className="stack">
        {[
          ['Is the Dean’s sign-off required for every proposal, or only above a threshold?', 'Responsibility'],
          ['What happens if the sponsor portal rejects the submission?', 'Exception'],
        ].map(([q, kind]) => (
          <div key={q} className="list-row" style={{ alignItems: 'flex-start', padding: '10px 14px' }}>
            <HelpCircle size={14} color="var(--returned)" style={{ marginTop: 3, flex: 'none' }} />
            <div className="stack" style={{ gap: 2 }}><span className="small">{q}</span><span className="hint">{kind}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Sources({ onReview }) {
  const [files, setFiles] = useState([
    { name: 'OSP_PreAward_Procedures_2025.pdf', ext: 'pdf', size: '4.2 MB · 38 pages', state: 'review' },
    { name: 'Routing_checklist.xlsx', ext: 'xls', size: '86 KB', state: 'done' },
    { name: 'Whiteboard_photo.jpg', ext: 'jpg', size: '2.9 MB', state: 'processing' },
    { name: 'Budget_template_FY27.docx', ext: 'docx', size: '31.4 MB', state: 'err', err: 'Over the 25 MB limit. Compress or split the file and upload again.' },
    { name: 'routing_macro.exe', ext: 'exe', size: '1.1 MB', state: 'err', err: 'Executable files can’t be uploaded. Use PDF, DOCX, XLS, PNG or JPG.' },
  ])
  return (
    <div className="card">
      <div className="card-head"><h3>Supporting documents</h3><span className="hint num">3 of 10 files</span></div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label className="dropzone">
          <Paperclip size={18} />
          <span className="small"><b style={{ fontWeight: 600, color: 'var(--navy)' }}>Choose files</b> or drop them here</span>
          <span className="hint">PDF, DOCX, XLS, PNG, JPG · up to 25 MB and 100 pages each · typed English</span>
          <input type="file" multiple hidden accept=".pdf,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
        </label>
        {files.map((f, i) => (
          <div key={f.name} className={`file ${f.state === 'err' ? 'err' : ''}`}>
            <FileIcon ext={f.ext} />
            <div className="stack" style={{ gap: 3, minWidth: 0 }}>
              <span className="small" style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
              {f.state === 'processing' && <><div className="bar"><i style={{ width: '62%' }} /></div><span className="hint">Extracting text and layout…</span></>}
              {f.state === 'review' && <span className="hint" style={{ color: 'var(--returned)' }}>Extracted · 3 sections need your check</span>}
              {f.state === 'done' && <span className="hint" style={{ color: 'var(--approved)' }}>Extracted · confirmed by you</span>}
              {f.state === 'err' && <span className="hint" style={{ color: 'var(--brick)' }}>{f.err}</span>}
            </div>
            {f.state === 'review' ? <button className="btn sm" onClick={onReview}>Review</button>
              : f.state === 'err' ? <button className="btn ghost sm icon" aria-label="Remove" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}><X /></button>
                : <span className="hint">{f.size.split(' · ')[0]}</span>}
          </div>
        ))}
        <span className="hint">Originals stay attached to this process for your supervisor and future revisions.</span>
      </div>
    </div>
  )
}
