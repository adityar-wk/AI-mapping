import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { Topbar } from '../../App'
import { PROCESSES, PERSONAS, fmtDate, greeting } from '../../data'
import ProcessCard from '../../components/ProcessCard'

const me = PERSONAS.user

export default function Home() {
  const nav = useNavigate()
  const [f, setF] = useState('all')
  const mine = PROCESSES.filter((p) => p.creator === me.name)
  const rows = f === 'all' ? mine : mine.filter((p) => p.status === f)
  // every returned process gets a row; the comment is the supervisor's own words, recorded on Return
  const returned = mine.filter((p) => p.status === 'returned')
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
            <p className="lede">{greeting()}, {me.name.split(' ')[0]}. Your submissions go to {me.supervisor} for review.</p>
          </div>
        </div>

        {returned.length > 0 && (
          <section className="card attn" aria-label="Returned to you">
            <div className="attn-head"><span className="tag returned">Returned</span><span className="hint">{returned.length} to correct</span></div>
            {returned.map((p) => (
              <button key={p.id} className="attn-row" onClick={() => nav(`/process/${p.id}/edit`)}>
                <div className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="row gap2" style={{ minWidth: 0 }}>
                    <b className="attn-name">{p.name}</b>
                    <span className="hint" style={{ flex: 'none' }}>{p.supervisor} · {fmtDate(p.updated)}</span>
                  </span>
                  {p.feedback && <span className="attn-note">“{p.feedback}”</span>}
                </div>
                <span className="attn-go">Correct<ChevronRight size={14} /></span>
              </button>
            ))}
          </section>
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
