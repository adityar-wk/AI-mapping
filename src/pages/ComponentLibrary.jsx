import { useState } from 'react'
import {
  Plus, Download, Trash2, ArrowRight, Loader2, Search, Mic, Send, Paperclip, Sparkles, MessageSquareText, Info, CheckCircle2,
  AlertTriangle, XCircle, Lock, RefreshCw, RotateCcw, PenLine, Inbox, MoreHorizontal, Eye, Landmark, CornerUpLeft, BadgeCheck, X, HelpCircle,
} from 'lucide-react'
import { Topbar } from '../App'
import { Tag, Seal, Rail, Avatar, Modal, Drawer, Dropdown, Empty, FileIcon, LockedNote, useToast } from '../components/ui'
import Swimlane, { MapLegend } from '../components/Swimlane'
import ProcessDoc, { deriveSteps } from '../components/ProcessDoc'
import ProcessCard from '../components/ProcessCard'
import { LANES, NODES, EDGES, DOC, PROCESSES, VERSIONS, NOTIFICATIONS, fmtDateTime } from '../data'
import NotificationBell from '../components/Notifications'

const SECTIONS = [
  ['foundations', 'Foundations'], ['buttons', 'Buttons'], ['forms', 'Form controls'], ['status', 'Status & identity'],
  ['cards', 'Cards & data'], ['feedback', 'Feedback & overlays'], ['capture', 'Capture & AI'], ['outputs', 'Process outputs'],
]

export default function ComponentLibrary() {
  const toast = useToast()
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [seg, setSeg] = useState('map')
  const [tab, setTab] = useState('a')

  return (
    <>
      <Topbar title="Component library" />
      <div className="page" style={{ display: 'grid', gridTemplateColumns: '180px minmax(0,1fr)', gap: 32, alignItems: 'start' }}>
        <nav className="stack gap1 sticky-side" aria-label="Sections">
          <span className="eyebrow" style={{ padding: '0 12px 8px' }}>On this page</span>
          {SECTIONS.map(([id, l]) => <a key={id} href={`#${id}`} className="nav-item" style={{ padding: '7px 12px', fontSize: 13 }}>{l}</a>)}
        </nav>

        <div className="stack" style={{ gap: 48, minWidth: 0 }}>
          <div className="page-head"><div><p className="lede">Every building block used across Process Atlas, rendered from the same components the screens use. Tokens live in <span className="mono">src/styles.css</span>.</p></div></div>

          {/* ── Foundations ── */}
          <Section id="foundations" title="Foundations" sub="One brand colour (UD navy) on a very light grey canvas. No pure black or white surfaces. Status tones only carry status.">
            <Sub title="Colour">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                {[['--cta', 'Primary button'], ['--cta-hover', 'Primary hover'], ['--nav-active', 'Sidebar selection'], ['--head-bg', 'Table header'], ['--row-hover', 'Row hover'], ['--navy', 'Brand / focus'], ['--navy-wash', 'Active nav'], ['--paper', 'Canvas'], ['--sheet', 'Card'], ['--btn', 'Button'], ['--well', 'Inset'], ['--on-dark', 'Text on navy'],
                  ['--ink', 'Text'], ['--ink-2', 'Secondary'], ['--ink-3', 'Meta'], ['--ink-4', 'Muted'],
                  ['--approved', 'Approved'], ['--returned', 'Returned'], ['--brick', 'Destructive']].map(([v, l]) => (
                  <div key={v} className="cl-swatch"><i style={{ background: `var(${v})`, boxShadow: 'inset 0 -1px 0 var(--rule)' }} /><div><span className="small" style={{ fontWeight: 600 }}>{l}</span><span className="cl-label">{v}</span></div></div>
                ))}
              </div>
            </Sub>
            <Sub title="Typography · Inter, JetBrains Mono">
              <div className="card card-pad stack gap4">
                <h1>Heading 1 · 24 / 700</h1>
                <h2>Heading 2 · 18 / 650</h2>
                <h3>Heading 3 · 15 / 650</h3>
                <span className="pcard-title">Card title · 17 / 700</span>
                <p>Body · 14 / 400 — Describe how the work gets done and the AI will draw the swimlane map and write the document.</p>
                <p className="small ink2">Small · 13 / 400 — supporting text</p>
                <span className="eyebrow">Eyebrow label · 11 / 600 uppercase</span>
                <span className="mono">Mono · v2.1 · tnt_7f3a91c2</span>
              </div>
            </Sub>
            <Sub title="Radius & elevation">
              <div className="cl-demo">
                {[['10px', 'Small'], ['14px', 'Medium'], ['20px', 'Card'], ['999px', 'Pill']].map(([r, l]) => (
                  <div key={r} className="stack gap1" style={{ alignItems: 'center' }}><div style={{ width: 88, height: 60, borderRadius: r, background: 'var(--sheet)', boxShadow: 'var(--card-shadow)' }} /><span className="cl-label">{l} · {r}</span></div>
                ))}
                <div className="stack gap1" style={{ alignItems: 'center' }}><div style={{ width: 88, height: 60, borderRadius: 20, background: 'var(--sheet)', boxShadow: 'var(--lift)' }} /><span className="cl-label">Lifted (hover, menus)</span></div>
              </div>
            </Sub>
          </Section>

          {/* ── Buttons ── */}
          <Section id="buttons" title="Buttons" sub="Pill-shaped. One primary per view.">
            <div className="card card-pad stack gap4">
              <div className="cl-demo">
                <button className="btn primary"><Plus />Primary</button>
                <button className="btn">Default</button>
                <button className="btn ghost">Ghost</button>
                <button className="btn danger"><Trash2 />Danger</button>
                <button className="btn danger solid"><Trash2 />Destructive</button>
                <button className="btn primary" disabled>Disabled</button>
                <button className="btn primary" disabled><Loader2 className="spin" />Submitting…</button>
              </div>
              <div className="cl-demo">
                <button className="btn sm primary">Small primary</button>
                <button className="btn sm"><Download />Small</button>
                <button className="btn icon" aria-label="Icon"><MoreHorizontal /></button>
                <button className="btn sm icon" aria-label="Icon"><PenLine /></button>
                <button className="btn round" aria-label="Round"><ArrowRight /></button>
                <button className="btn round" aria-label="Round"><PenLine /></button>
              </div>
            </div>
          </Section>

          {/* ── Forms ── */}
          <Section id="forms" title="Form controls">
            <div className="card card-pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              <div className="field"><label>Text input</label><input className="input" placeholder="name@udallas.edu" /><span className="hint">Helper text sits under the field.</span></div>
              <div className="field"><label>Read-only</label><input className="input" readOnly value="tnt_7f3a91c2" /></div>
              <div className="field"><label>Select</label><select className="select"><option>Daniel Reyes</option><option>Marcus Bell</option></select></div>
              <div className="field"><label>Search</label><div className="search"><Search /><input className="input" placeholder="Search processes…" /></div></div>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Textarea</label><textarea className="textarea" placeholder="What needs to change?" /></div>
              <div className="field"><label>Checkbox & radio</label>
                <label className="check"><input type="checkbox" defaultChecked />Map as PDF</label>
                <label className="check"><input type="checkbox" />Map as PNG</label>
                <label className="check"><input type="radio" name="r" defaultChecked style={{ accentColor: 'var(--navy-deep)' }} />Use document</label>
              </div>
              <div className="field"><label>Segmented control</label>
                <div className="seg" style={{ alignSelf: 'flex-start' }}>{[['map', 'Map'], ['doc', 'Document'], ['both', 'Both']].map(([k, l]) => <button key={k} className={seg === k ? 'on' : ''} onClick={() => setSeg(k)}>{l}</button>)}</div>
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Tabs</label>
                <div className="tabs">{[['a', 'Map'], ['b', 'Document'], ['c', 'Version history']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
              </div>
              <div className="field"><label>Dropzone</label>
                <label className="dropzone"><Paperclip size={18} /><span className="small"><b style={{ color: 'var(--navy)' }}>Choose files</b> or drop here</span><span className="hint">PDF, DOCX, XLS, PNG, JPG · 25 MB</span></label>
              </div>
            </div>
          </Section>

          {/* ── Status ── */}
          <Section id="status" title="Status & identity" sub="The lifecycle rail and version seal appear on every process.">
            <div className="card card-pad stack gap6">
              <Row label="Status pill"><Tag status="draft" /><Tag status="review" /><Tag status="returned">Returned</Tag><Tag status="approved" /><Tag kind="danger">Suspended</Tag><span className="tag outline">View-only</span></Row>
              <Row label="Lifecycle rail"><div className="stack gap2"><Rail status="draft" /><Rail status="review" /><Rail status="returned" /><Rail status="approved" /></div></Row>
              <Row label="Version"><Seal v="3.0" /><Seal v="2.1" /><span className="hint">Status is never attached to the version — it shows in its own column.</span></Row>
              <Row label="Save state"><span className="save"><CheckCircle2 />Saved · 3:42 PM</span><span className="save"><Loader2 className="spin" />Saving…</span><span className="save warn"><AlertTriangle />Unsaved changes</span></Row>
              <Row label="Icon tile"><span className="tile"><Landmark /></span><span className="tile green"><BadgeCheck /></span><span className="tile amber"><CornerUpLeft /></span><span className="tile rose"><XCircle /></span><span className="tile grey"><Plus /></span><span className="tile sm"><Landmark /></span></Row>
              <Row label="Avatar, chip, counts"><Avatar name="Maria Okafor" /><Avatar name="Daniel Reyes" sm /><span className="chip">#pre-award</span><span className="chip"><Avatar name="Leo Brandt" sm />Leo Brandt</span><span className="count-pill" style={{ marginLeft: 0 }}>23</span><span className="nav-count" style={{ marginLeft: 0 }}>4</span><span className="kbd">Enter</span></Row>
            </div>
          </Section>

          {/* ── Cards ── */}
          <Section id="cards" title="Cards & data">
            <Sub title="Process card">
              <div className="card-grid">
                <ProcessCard p={PROCESSES[0]} mine onOpen={() => {}} />
                <ProcessCard p={PROCESSES[6]} own={false} showDept onOpen={() => {}} />
              </div>
            </Sub>
            <Sub title="Stat cards">
              <div className="ledger" style={{ '--cols': 3 }}>
                <div><span className="eyebrow">Users</span><span className="big">14</span><span className="sub">12 active · 1 invited</span></div>
                <div><span className="eyebrow">Storage</span><span className="big">18.4 <span style={{ fontSize: 15 }}>GB</span></span><div className="bar" style={{ marginTop: 6 }}><i style={{ width: '37%' }} /></div></div>
                <div><span className="eyebrow">Processes</span><span className="big">22</span><div className="stackbar" style={{ marginTop: 6 }}><i style={{ width: '68%', background: 'var(--approved)' }} /><i style={{ width: '14%', background: 'var(--navy)' }} /><i style={{ width: '5%', background: 'var(--returned)' }} /><i style={{ width: '13%', background: 'var(--ink-4)' }} /></div></div>
              </div>
            </Sub>
            <Sub title="Table">
              <div className="card">
                <table className="table">
                  <thead><tr><th>Process</th><th>Lifecycle</th><th>Version</th><th className="right">Updated</th></tr></thead>
                  <tbody>{PROCESSES.slice(0, 3).map((p) => <tr key={p.id}><td className="t-title">{p.name}</td><td><Rail status={p.status} /></td><td><Seal v={p.version} status={p.status} /></td><td className="right ink2">Nov 16</td></tr>)}</tbody>
                </table>
              </div>
            </Sub>
            <Sub title="List rows">
              <div className="card">
                <div className="list-row clickable"><Avatar name="Hannah Cole" /><div className="stack grow" style={{ gap: 2 }}><span style={{ fontWeight: 600 }}>Award acceptance and account setup</span><span className="hint">Hannah Cole · new process</span></div><Seal v="1.0" status="review" note="Submitted" /><button className="btn sm primary">Review</button></div>
                <div className="list-row"><HelpCircle size={15} color="var(--returned)" /><span className="small grow">What happens if the sponsor portal rejects the submission?</span><span className="hint">Exception</span></div>
              </div>
            </Sub>
          </Section>

          {/* ── Feedback ── */}
          <Section id="feedback" title="Feedback & overlays">
            <div className="stack gap2">
              <div className="notice info"><Info /><span><b>Info.</b> Select a step on the map to edit it.</span></div>
              <div className="notice ok"><CheckCircle2 /><span><b>Success.</b> Extracted content confirmed.</span></div>
              <div className="notice warn"><AlertTriangle /><span><b>Warning.</b> 2 questions are still open.</span></div>
              <div className="notice err"><XCircle /><span><b>Error.</b> Over the 25 MB limit. Compress the file and upload again.</span></div>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="syncbar"><AlertTriangle /><span className="grow"><b>The map changed.</b> The document still describes the previous flow.</span><button className="btn sm"><RefreshCw />Update document</button></div>
              <LockedNote>Under review by Daniel Reyes. Editing is locked until the review is complete.</LockedNote>
              <Empty icon={<Inbox />} title="Nothing to review" body="You’ll get an email and an in-app notification when someone submits." />
            </div>
            <div className="cl-demo">
              <button className="btn" onClick={() => setModal(true)}>Open modal</button>
              <button className="btn" onClick={() => setDrawer(true)}>Open drawer</button>
              <span className="row gap2"><span className="hint">Notifications</span><NotificationBell items={NOTIFICATIONS.supervisor} /></span>
              <button className="btn" onClick={() => toast('Submitted to Daniel Reyes')}>Show toast</button>
              <Dropdown align="left" trigger={({ toggle }) => <button className="btn" onClick={toggle}>Dropdown menu<MoreHorizontal /></button>}>
                <div className="menu-label">Actions</div>
                <button><PenLine />Edit profile</button>
                <button><Eye />View history</button>
                <button disabled><Trash2 />Delete · has records</button>
              </Dropdown>
            </div>
          </Section>

          {/* ── Capture ── */}
          <Section id="capture" title="Capture & AI">
            <div className="grid-2" style={{ alignItems: 'start' }}>
              <div className="card">
                <div className="convo">
                  <div className="msg sys"><div className="msg-body">The AI only records what you tell it — it asks rather than guesses.</div></div>
                  <div className="msg ai"><span className="msg-meta"><Sparkles />Process assistant</span><div className="msg-body">Who checks eligibility?<ol className="qlist"><li>You, or someone else in Sponsored Programs?</li></ol></div></div>
                  <div className="msg me"><span className="msg-meta"><Mic />You · transcribed</span><div className="msg-body">The Sponsored Programs Officer checks eligibility.</div></div>
                </div>
                <div className="pane-foot" style={{ borderRadius: '0 0 20px 20px' }}>
                  <div className="composer-box"><textarea placeholder="Ask for a change…" /><div className="row spread"><button className="btn ghost sm"><Mic />Speak</button><button className="btn primary sm"><Send />Send</button></div></div>
                </div>
              </div>
              <div className="stack gap4">
                <div className="card" style={{ padding: 8 }}>
                  <div className="row gap2" style={{ padding: '8px 10px' }}><span className="meter">{[0, 1, 2, 3].map((k) => <i key={k} style={{ animationDelay: `${k * 120}ms` }} />)}</span><span className="small" style={{ fontWeight: 600 }}>Live transcript</span></div>
                  <div className="seg-line"><span className="t">00:04</span><span>The PI drafts the budget and narrative,</span><div className="acts"><button className="btn ghost sm icon"><RotateCcw /></button></div></div>
                  <div className="seg-line flag"><span className="t">00:09</span><div className="stack gap1"><span>…compliance forms in Kayuse.</span><span className="small" style={{ color: 'var(--returned)' }}>Low confidence: did you mean “Cayuse”?</span></div><div className="acts"><button className="btn ghost sm icon"><RotateCcw /></button><button className="btn ghost sm icon"><PenLine /></button></div></div>
                  <div className="seg-line"><span className="t">00:15</span><span>Then the chair reviews<span className="live-caret" /></span><div /></div>
                </div>
                <div className="stack gap2">
                  <div className="file"><FileIcon ext="pdf" /><div className="stack" style={{ gap: 2 }}><span className="small" style={{ fontWeight: 600 }}>OSP_Procedures.pdf</span><span className="hint" style={{ color: 'var(--approved)' }}>Extracted · confirmed</span></div><span className="hint">4.2 MB</span></div>
                  <div className="file"><FileIcon ext="jpg" /><div className="stack" style={{ gap: 4 }}><span className="small" style={{ fontWeight: 600 }}>Whiteboard.jpg</span><div className="bar"><i style={{ width: '60%' }} /></div></div><span className="hint">Processing</span></div>
                  <div className="file err"><FileIcon ext="exe" /><div className="stack" style={{ gap: 2 }}><span className="small" style={{ fontWeight: 600 }}>macro.exe</span><span className="hint" style={{ color: 'var(--brick)' }}>Executable files can’t be uploaded.</span></div><button className="btn ghost sm icon"><X /></button></div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Outputs ── */}
          <Section id="outputs" title="Process outputs" sub="The swimlane map and written document always share one version.">
            <Sub title="Swimlane map">
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="map-wrap" style={{ overflow: 'auto', padding: 16 }}>
                  <div style={{ border: '1px solid var(--rule)', borderRadius: 12, width: 'max-content', background: 'var(--sheet)' }}>
                    <Swimlane lanes={LANES} nodes={NODES} edges={EDGES} />
                  </div>
                </div>
                <div className="pane-foot"><MapLegend /></div>
              </div>
            </Sub>
            <Sub title="Written document">
              <div className="card" style={{ maxHeight: 460, overflow: 'auto' }}>
                <ProcessDoc doc={DOC} steps={deriveSteps(NODES, EDGES, LANES)} editable version="3.0" status="draft" />
              </div>
            </Sub>
            <Sub title="Version timeline">
              <div className="card card-pad">
                <div className="vline">
                  {VERSIONS.map((v) => (
                    <div key={v.v} className={`vitem ${v.state === 'current' ? 'current' : ''} ${v.state === 'draft' ? 'draft' : ''}`}>
                      <div className="row gap2"><span className="mono" style={{ fontWeight: 600 }}>v{v.v}</span>{v.state === 'current' ? <Tag status="approved">Current</Tag> : v.state === 'draft' ? <Tag status="draft">Draft</Tag> : <span className="tag outline">Historical</span>}</div>
                      <p className="small" style={{ marginTop: 4 }}>{v.summary}</p>
                      <span className="hint">{v.by} · {fmtDateTime(v.at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Sub>
          </Section>
        </div>
      </div>

      {modal && (
        <Modal title="Approve v1.0" sub="The map and document are approved together as one locked version." onClose={() => setModal(false)}
          foot={<><button className="btn ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn primary" onClick={() => setModal(false)}><BadgeCheck />Approve and publish</button></>}>
          <div className="field"><label>Note to author <span className="hint">(optional)</span></label><textarea className="textarea" /></div>
        </Modal>
      )}
      {drawer && (
        <Drawer onClose={() => setDrawer(false)}>
          <div className="pane-head"><h2>Notifications</h2><button className="btn ghost sm icon" onClick={() => setDrawer(false)}><X /></button></div>
          <div className="pane-body">
            <div className="list-row clickable" style={{ alignItems: 'flex-start' }}><span className="dot" style={{ marginTop: 7 }} /><div className="stack" style={{ gap: 2 }}><span style={{ fontWeight: 600 }}>Award acceptance submitted</span><span className="small ink2">Hannah Cole submitted v1.0 for your review.</span><span className="hint">4 hours ago · In-app · Email</span></div></div>
          </div>
        </Drawer>
      )}
    </>
  )
}

function Section({ id, title, sub, children }) {
  return (
    <section id={id} className="cl-section">
      <div className="cl-head"><h2 style={{ fontSize: 20 }}>{title}</h2>{sub && <p className="muted small">{sub}</p>}</div>
      {children}
    </section>
  )
}
function Sub({ title, children }) {
  return <div className="stack gap2"><span className="eyebrow">{title}</span>{children}</div>
}
function Row({ label, children }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
      <span className="eyebrow" style={{ width: 140, flex: 'none', paddingTop: 4 }}>{label}</span>
      <div className="cl-demo grow">{children}</div>
    </div>
  )
}
