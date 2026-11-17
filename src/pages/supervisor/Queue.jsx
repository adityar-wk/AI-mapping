import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox, Search } from 'lucide-react'
import { Topbar } from '../../App'
import { PROCESSES, CATEGORIES, fmtDate } from '../../data'
import { Rail, Seal, Avatar, Empty, Tag } from '../../components/ui'

const DEPT = 'Office of Sponsored Programs'

export default function Queue({ tab }) {
  const nav = useNavigate()
  const [cat, setCat] = useState('')
  const [tag, setTag] = useState('')
  const [q, setQ] = useState('')
  const dept = PROCESSES.filter((p) => p.dept === DEPT)
  const queue = dept.filter((p) => p.status === 'review').sort((a, b) => new Date(a.updated) - new Date(b.updated))
  const waited = (iso) => Math.max(1, Math.round((new Date('2026-11-17T09:00') - new Date(iso)) / 864e5))

  if (tab === 'queue') {
    return (
      <>
        <Topbar title="Review queue" />
        <div className="page">
          <div className="page-head">
            <div><p className="lede">{queue.length} submissions from {DEPT} are waiting for your review, oldest first.</p></div>
          </div>
          <div className="card">
            {queue.length === 0 ? <Empty icon={<Inbox />} title="Nothing to review" body="You’ll get an email and an in-app notification when someone submits." /> : queue.map((p, i) => (
              <div key={p.id} className="list-row clickable" style={{ padding: '16px 20px', gap: 16 }} onClick={() => nav(`/review/${p.id}`)}>
                <span className="mono muted" style={{ width: 22 }}>{String(i + 1).padStart(2, '0')}</span>
                <div className="stack grow" style={{ gap: 4 }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span className="row gap2 small ink2"><Avatar name={p.creator} sm />{p.creator} · {p.approvedVersion ? <>update to approved v{p.approvedVersion}</> : 'new process'} · {p.category}</span>
                </div>
                <Seal v={p.version} />
                <div className="stack" style={{ gap: 2, alignItems: 'flex-end', width: 110 }}>
                  <span className="num" style={{ fontWeight: 500 }}>{waited(p.updated)} day{waited(p.updated) > 1 ? 's' : ''}</span>
                  <span className="hint">since {fmtDate(p.updated)}</span>
                </div>
                <button className="btn sm primary" onClick={(e) => { e.stopPropagation(); nav(`/review/${p.id}`) }}>Review</button>
              </div>
            ))}
          </div>
          <p className="hint">Approving locks the version and publishes it; you can also revise directly or return it with feedback.</p>
        </div>
      </>
    )
  }

  const tags = [...new Set(dept.flatMap((p) => p.tags))]
  const rows = dept.filter((p) => (!cat || p.category === cat) && (!tag || p.tags.includes(tag)) && (!q || p.name.toLowerCase().includes(q.toLowerCase())))
  return (
    <>
      <Topbar title="Department processes" />
      <div className="page">
        <div className="page-head"><div><p className="lede">Every process created by users in {DEPT}, in any state.</p></div></div>
        <div className="row wrap gap2">
          <div className="search" style={{ width: 280 }}><Search /><input className="input" placeholder="Search processes" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="select" style={{ width: 'auto' }} value={DEPT} disabled aria-label="Department"><option>{DEPT}</option></select>
          <select className="select" style={{ width: 'auto' }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">Category: any</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="select" style={{ width: 'auto' }} value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag"><option value="">Tag: any</option>{tags.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="card">
          <table className="table">
            <thead><tr><th>Process</th><th>Creator</th><th>Status</th><th>Latest version</th><th>Updated</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="clickable" onClick={() => nav(p.status === 'review' ? `/review/${p.id}` : `/process/${p.id}`)}>
                  <td><div className="stack" style={{ gap: 2 }}><span className="t-title">{p.name}</span><span className="hint">{p.category} · {p.tags.join(', ')}</span></div></td>
                  <td className="ink2">{p.creator}</td>
                  <td><Tag status={p.status} /></td>
                  <td><div className="stack" style={{ gap: 3, alignItems: "flex-start" }}><Seal v={p.version} status={p.status} />{p.approvedVersion && p.approvedVersion !== p.version && <span className="hint">v{p.approvedVersion} is current</span>}</div></td>
                  <td className="ink2 num">{fmtDate(p.updated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
