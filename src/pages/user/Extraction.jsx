import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, FileWarning, Upload, Scale, Info, PenLine } from 'lucide-react'
import { Topbar } from '../../App'
import { FileIcon, useToast } from '../../components/ui'

const FILES = [
  { name: 'OSP_PreAward_Procedures_2025.pdf', ext: 'pdf', meta: '38 pages · scanned', flags: 3 },
  { name: 'Routing_checklist.xlsx', ext: 'xls', meta: '2 sheets', flags: 0, done: true },
  { name: 'Whiteboard_photo.jpg', ext: 'jpg', meta: 'Processing', flags: 0, busy: true },
]

export default function Extraction() {
  const nav = useNavigate()
  const toast = useToast()
  const [blocks, setBlocks] = useState({ lc: false, conflict: null, unreadable: null })
  const [cell, setCell] = useState('5 business days')
  const open = [!blocks.lc, !blocks.conflict, !blocks.unreadable].filter(Boolean).length

  return (
    <>
      <Topbar wide crumbs={[{ label: 'My processes', to: '/home' }, { label: 'Grant pre-award proposal routing', to: '/capture/new' }, { label: 'Review extracted content' }]}>
        <span className="hint">{open ? `${open} item${open > 1 ? 's' : ''} need your check` : 'All sections checked'}</span>
        <button className="btn" onClick={() => nav('/capture/new')}>Back to conversation</button>
        <button className="btn primary" onClick={() => { toast('Reviewed content saved — it will be used for generation'); nav('/capture/new') }}><Check />Confirm reviewed content</button>
      </Topbar>

      <div className="workspace" style={{ gridTemplateColumns: '260px 1fr 1fr' }}>
        <aside className="pane" style={{ background: 'var(--paper)' }}>
          <div className="pane-head"><h3 style={{ fontFamily: 'var(--sans)' }}>Documents</h3></div>
          <div className="pane-body" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FILES.map((f, i) => (
              <div key={f.name} className="file" style={{ cursor: 'pointer', borderColor: i === 0 ? 'var(--navy)' : undefined, gridTemplateColumns: '32px 1fr' }}>
                <FileIcon ext={f.ext} />
                <div className="stack" style={{ gap: 2, minWidth: 0 }}>
                  <span className="small" style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span className="hint">{f.meta}</span>
                  {f.flags > 0 && <span className="hint" style={{ color: 'var(--returned)' }}>{open} to check</span>}
                  {f.done && <span className="hint" style={{ color: 'var(--approved)' }}>Confirmed</span>}
                </div>
              </div>
            ))}
            <div className="notice" style={{ marginTop: 8, fontSize: 12 }}>
              <Info />
              <span>Best results: typed English, readable at 100% zoom, scans at 200 DPI or more (300 recommended), straight and well lit. Handwriting isn’t supported.</span>
            </div>
          </div>
        </aside>

        <section className="pane">
          <div className="pane-head"><span className="small ink2">Original · page 6 of 38</span><span className="hint">Source is kept with the process</span></div>
          <div className="pane-body" style={{ background: 'var(--well)', padding: 24 }}>
            <ScanPage />
          </div>
        </section>

        <section className="pane">
          <div className="pane-head"><span className="small" style={{ fontWeight: 600 }}>Extracted content</span><span className="hint">Edit anything that’s wrong</span></div>
          <div className="pane-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Block title="§ 4.2 Eligibility review" ok>
              <p contentEditable suppressContentEditableWarning className="ink2" style={{ outline: 'none' }}>The Sponsored Programs Officer confirms sponsor eligibility, limited-submission rules and the internal deadline, which is five business days before the sponsor deadline.</p>
            </Block>

            <Block title="§ 4.3 Routing timeline (table)" ok>
              <table className="table" style={{ fontSize: 13 }}>
                <thead><tr><th>Stage</th><th>Owner</th><th>Due before sponsor deadline</th></tr></thead>
                <tbody>
                  <tr><td>Intent to apply</td><td>PI</td><td>30 days</td></tr>
                  <tr><td>Draft budget</td><td>PI</td><td>10 days</td></tr>
                  <tr><td>Chair & Dean approval</td><td>Chair, Dean</td><td><input className="input" value={cell} onChange={(e) => setCell(e.target.value)} style={{ padding: '3px 6px' }} aria-label="Edit cell" /></td></tr>
                </tbody>
              </table>
            </Block>

            <Block title="§ 4.4 Compliance forms" warn={!blocks.lc}>
              {!blocks.lc ? (
                <>
                  <p className="ink2">Forms are completed in <mark style={{ background: 'var(--returned-wash)', color: 'var(--returned)', padding: '0 3px', borderRadius: 2 }}>Cay?se SP</mark> and include conflict-of-interest disclosures and <mark style={{ background: 'var(--returned-wash)', color: 'var(--returned)', padding: '0 3px', borderRadius: 2 }}>[unclear: 2 words]</mark> for human-subjects research.</p>
                  <div className="notice warn" style={{ fontSize: 12.5 }}><AlertTriangle /><span>Low confidence. Check the highlighted words against the original before this is used.</span></div>
                  <div className="row gap2"><button className="btn sm" onClick={() => setBlocks((b) => ({ ...b, lc: true }))}><PenLine />Correct and confirm</button></div>
                </>
              ) : <p className="ink2">Forms are completed in Cayuse SP and include conflict-of-interest disclosures and IRB protocol numbers for human-subjects research.</p>}
            </Block>

            <Block title="Conflict with your conversation" warn={!blocks.conflict} icon={<Scale size={14} />}>
              <p className="small ink2">The document and what you said disagree. Nothing is applied until you choose.</p>
              <div className="stack gap2">
                {[['doc', 'Document, page 7', '“Dean sign-off is required only for proposals over $250,000.”'], ['chat', 'You said (voice, 00:31)', '“The dean signs off on every proposal.”']].map(([k, src, q]) => (
                  <label key={k} className="file" style={{ gridTemplateColumns: '20px 1fr', cursor: 'pointer', borderColor: blocks.conflict === k ? 'var(--navy)' : undefined }}>
                    <input type="radio" name="conf" checked={blocks.conflict === k} onChange={() => setBlocks((b) => ({ ...b, conflict: k }))} style={{ accentColor: 'var(--navy)' }} />
                    <span className="stack" style={{ gap: 2 }}><span className="hint">{src}</span><span className="small" style={{ fontFamily: 'var(--serif)', fontSize: 14 }}>{q}</span></span>
                  </label>
                ))}
              </div>
            </Block>

            <Block title="Page 14 could not be read" err={!blocks.unreadable} icon={<FileWarning size={14} />}>
              {!blocks.unreadable ? (
                <>
                  <p className="small ink2">The scan is blurred and rotated. Nothing from this page has been extracted or marked as processed.</p>
                  <div className="row gap2 wrap">
                    <button className="btn sm"><Upload />Upload a clearer copy</button>
                    <button className="btn sm ghost" onClick={() => setBlocks((b) => ({ ...b, unreadable: 'manual' }))}>I’ll describe it in the conversation</button>
                    <button className="btn sm ghost" onClick={() => setBlocks((b) => ({ ...b, unreadable: 'skip' }))}>Not needed</button>
                  </div>
                </>
              ) : <p className="small muted">{blocks.unreadable === 'manual' ? 'You’ll cover page 14 in the conversation.' : 'Page 14 excluded from generation.'}</p>}
            </Block>
          </div>
        </section>
      </div>
    </>
  )
}

function Block({ title, ok, warn, err, icon, children }) {
  const tone = err ? 'var(--brick)' : warn ? 'var(--returned)' : 'var(--approved)'
  return (
    <div className="card" style={{ borderColor: err || warn ? `color-mix(in srgb, ${tone} 30%, transparent)` : undefined }}>
      <div className="card-head" style={{ padding: '10px 14px' }}>
        <span className="row gap2 small" style={{ fontWeight: 600, color: err || warn ? tone : 'var(--ink)' }}>{icon || (err || warn ? <AlertTriangle size={14} /> : null)}{title}</span>
        {!err && !warn && <span className="small row" style={{ color: 'var(--approved)', gap: 4 }}><Check size={14} />Checked</span>}
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function ScanPage() {
  const line = (w, o = 0.18) => <div style={{ height: 6, width: `${w}%`, background: `rgba(26,33,50,${o})`, borderRadius: 2 }} />
  return (
    <div style={{ background: '#fdfcf8', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '36px 32px', transform: 'rotate(-0.6deg)', maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 9, filter: 'contrast(0.96)' }}>
      <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 13 }}>4. Proposal Routing</div>
      <div style={{ fontWeight: 600, fontSize: 11, marginTop: 6 }}>4.2 Eligibility review</div>
      {line(96)}{line(92)}{line(70)}
      <div style={{ fontWeight: 600, fontSize: 11, marginTop: 10 }}>4.3 Routing timeline</div>
      <div style={{ border: '1px solid rgba(26,33,50,0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ borderRight: i % 3 < 2 ? '1px solid rgba(26,33,50,0.15)' : 0, borderBottom: i < 9 ? '1px solid rgba(26,33,50,0.15)' : 0, padding: 6 }}>{line(60 + (i % 3) * 10, i < 3 ? 0.3 : 0.16)}</div>)}
      </div>
      <div style={{ fontWeight: 600, fontSize: 11, marginTop: 10 }}>4.4 Compliance forms</div>
      <div style={{ outline: '2px solid var(--returned)', outlineOffset: 4, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 9, filter: 'blur(0.6px)' }}>{line(94)}{line(88)}{line(40)}</div>
      {line(90)}{line(84)}{line(62)}
    </div>
  )
}
