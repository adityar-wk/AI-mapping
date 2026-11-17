import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CornerUpLeft } from 'lucide-react'
import { Topbar } from '../../App'
import { PROCESSES, PERSONAS, fmtDate } from '../../data'
import { Tag } from '../../components/ui'
import ProcessCard from '../../components/ProcessCard'

const me = PERSONAS.user

export default function Home() {
  const nav = useNavigate()
  const [f, setF] = useState('all')
  const mine = PROCESSES.filter((p) => p.creator === me.name)
  const rows = f === 'all' ? mine : mine.filter((p) => p.status === f)
  const returned = mine.find((p) => p.status === 'returned')
  const open = (p) => nav(p.status === 'draft' || p.status === 'returned' ? `/process/${p.id}/edit` : `/process/${p.id}`)
  const count = (s) => mine.filter((p) => p.status === s).length

  return (
    <>
      <Topbar title="My processes">
        <button className="btn primary" onClick={() => nav('/capture/new')}><Plus />New process</button>
      </Topbar>
      <div className="page">
        <div className="page-head">
          <div>
            <p className="lede">Good afternoon, Maria. Your submissions go to {me.supervisor} for review.</p>
          </div>
        </div>

        {returned && (
          <div className="card row" style={{ padding: 20, gap: 16, alignItems: 'flex-start' }}>
            <span className="tile amber"><CornerUpLeft /></span>
            <div className="stack grow gap1">
              <span className="row gap2"><span className="tag returned">Returned</span><span className="hint">{fmtDate(returned.updated)} · {returned.supervisor}</span></span>
              <span style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{returned.name}</span>
              <p className="ink2">“{returned.feedback}”</p>
            </div>
            <button className="btn" onClick={() => nav(`/process/${returned.id}/edit`)}>Correct and resubmit</button>
          </div>
        )}

        <div className="row spread wrap gap2">
          <div className="row wrap gap2" role="tablist" aria-label="Filter by status">
            {[['all', 'All', mine.length], ['draft', 'Drafts', count('draft')], ['review', 'In review', count('review')], ['returned', 'Returned', count('returned')], ['approved', 'Approved', count('approved')]].map(([k, l, n]) => (
              <button key={k} role="tab" aria-selected={f === k} className={`fchip ${f === k ? 'on' : ''}`} onClick={() => setF(k)}>{l} <span className="fchip-n">{n}</span></button>
            ))}
          </div>
          <span className="hint">One active draft per process · submitted work is view-only during review</span>
        </div>

        <div className="card-grid">
          {rows.map((p) => <ProcessCard key={p.id} p={p} mine onOpen={() => open(p)} />)}
        </div>
      </div>
    </>
  )
}
