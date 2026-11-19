import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox, Search } from 'lucide-react'
import { Topbar } from '../../App'
import { PROCESSES, fmtDate } from '../../data'
import { Seal, Avatar, Empty, Tag, FilterButton } from '../../components/ui'

const DEPT = 'Office of Sponsored Programs'

export default function Queue({ tab }) {
  const nav = useNavigate()
  const [cat, setCat] = useState('')
  const [status, setStatus] = useState('any')
  const [tag, setTag] = useState('')
  const [dep, setDep] = useState('')
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

  const STATUS_OPTS = [['any', 'Any status'], ['draft', 'Draft'], ['review', 'In review'], ['returned', 'Returned'], ['approved', 'Approved']]
  const cats = [...new Set(dept.map((p) => p.category))]
  const tags = [...new Set(dept.flatMap((p) => p.tags))].sort()
  const deps = [...new Set(dept.map((p) => p.dept))]
  const rows = dept.filter((p) => (!cat || p.category === cat) && (!tag || p.tags.includes(tag)) && (!dep || p.dept === dep) && (status === 'any' || p.status === status) && (!q || p.name.toLowerCase().includes(q.toLowerCase())))
  return (
    <>
      <Topbar title="Department processes" />
      <div className="page">
        <div className="page-head"><div><p className="lede">Every process created by users in {DEPT}, in any state.</p></div></div>
        <div className="row wrap gap2">
          <div className="search" style={{ width: 300 }}><Search /><input className="input" placeholder="Search processes" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search processes" /></div>
          <FilterButton
            groups={[
              { key: 'status', label: 'Status', options: STATUS_OPTS.map(([v, l]) => [v, `${l} · ${v === 'any' ? dept.length : dept.filter((p) => p.status === v).length}`]) },
              { key: 'dep', label: 'Department', options: [['', 'Any department'], ...deps.map((d) => [d, d])] },
              { key: 'cat', label: 'Category', options: [['', 'Any category'], ...cats.map((c) => [c, c])] },
              { key: 'tag', label: 'Tag', options: [['', 'Any tag'], ...tags.map((t) => [t, `#${t}`])] },
            ]}
            values={{ status, cat, tag, dep }}
            onChange={(k, v) => ({ status: setStatus, cat: setCat, tag: setTag, dep: setDep })[k](v)}
            onClear={() => { setStatus('any'); setCat(''); setTag(''); setDep('') }} />
          <span className="hint num" style={{ marginLeft: 'auto' }}>{rows.length} of {dept.length} processes</span>
        </div>
        <div className="card">
          <table className="table">
            <thead><tr><th>Process</th><th>Creator</th><th>Status</th><th>Latest version</th><th>Updated</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 32 }}>No processes match these filters.</td></tr>}
              {rows.map((p) => (
                <tr key={p.id} className="clickable" onClick={() => nav(p.status === 'review' ? `/review/${p.id}` : `/process/${p.id}`)}>
                  <td><div className="stack" style={{ gap: 2 }}><span className="t-title">{p.name}</span><span className="hint">{p.category}{p.tags.length > 0 && ` · ${p.tags.map((t) => `#${t}`).join(' ')}`}</span></div></td>
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
