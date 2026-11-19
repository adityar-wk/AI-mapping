import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Lock, SearchX } from 'lucide-react'
import { Topbar } from '../App'
import { PROCESSES, DEPARTMENTS, GRANTS } from '../data'
import { Empty, FilterButton } from '../components/ui'
import ProcessCard from '../components/ProcessCard'

const OWN = 'Office of Sponsored Programs'
// own department, plus departments granted to it by the Institute Admin (department-level grants, IN-0257)
const GRANTED = GRANTS.filter((g) => g.kind === 'Department' && g.who === OWN).map((g) => g.target)
const ACCESS = Object.fromEntries(DEPARTMENTS.map((d) => [d.name, d.name === OWN ? 'own' : GRANTED.includes(d.name) ? 'granted' : 'none']))

const PERIODS = [['any', 'Any time'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last 12 months']]

export default function LibraryPage() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('all')
  const [cat, setCat] = useState('')
  const [creator, setCreator] = useState('')
  const [period, setPeriod] = useState('any')

  const approved = PROCESSES.filter((p) => p.status === 'approved' || p.approvedVersion)
  const visible = approved.filter((p) => ACCESS[p.dept] && ACCESS[p.dept] !== 'none')
  const cats = [...new Set(visible.map((p) => p.category))]
  const creators = [...new Set(visible.map((p) => p.creator))].sort()

  const rows = useMemo(() => visible.filter((p) => {
    const s = q.toLowerCase()
    if (s && !(p.name.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s)) || p.category.toLowerCase().includes(s))) return false
    if (dept !== 'all' && p.dept !== dept) return false
    if (cat && p.category !== cat) return false
    if (creator && p.creator !== creator) return false
    if (period !== 'any' && Date.now() - new Date(p.updated) > Number(period) * 864e5) return false
    return true
  }), [q, dept, cat, creator, period])

  // a locked chip only appears for departments that actually have approved processes
  const deptList = DEPARTMENTS.filter((d) => ACCESS[d.name] !== 'none' || approved.some((p) => p.dept === d.name))
  const count = (name) => visible.filter((p) => p.dept === name).length
  const groups = deptList.filter((d) => ACCESS[d.name] !== 'none').map((d) => [d, rows.filter((p) => p.dept === d.name)]).filter(([, list]) => list.length)

  const card = (p) => <ProcessCard key={p.id} p={p} own={ACCESS[p.dept] === 'own'} showDept={false} onOpen={() => nav(`/process/${p.id}`)} />

  return (
    <>
      <Topbar title="Process library" />
      <div className="page">
        <p className="lede muted">Approved processes only. Each opens at its current approved version, with earlier versions in its history.</p>

        <div className="stack gap4">
          <div className="row wrap gap2">
            <div className="search" style={{ width: 300 }}><Search /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or keyword" aria-label="Search processes" /></div>
            <FilterButton
              groups={[
                { key: 'cat', label: 'Category', options: [['', 'Any category'], ...cats.map((c) => [c, c])] },
                { key: 'creator', label: 'Creator', options: [['', 'Anyone'], ...creators.map((c) => [c, c])] },
                { key: 'period', label: 'Last updated', options: PERIODS },
              ]}
              values={{ cat, creator, period }}
              onChange={(k, v) => ({ cat: setCat, creator: setCreator, period: setPeriod })[k](v)}
              onClear={() => { setCat(''); setCreator(''); setPeriod('any') }} />
          </div>

          <div className="row wrap gap2" role="tablist" aria-label="Libraries">
            <button role="tab" aria-selected={dept === 'all'} className={`fchip ${dept === 'all' ? 'on' : ''}`} onClick={() => setDept('all')}>All permitted <span className="fchip-n">{visible.length}</span></button>
            {deptList.map((d) => {
              const a = ACCESS[d.name]
              if (a === 'none') {
                return <button key={d.id} className="fchip locked" disabled title="No access — ask your Institute Admin"><Lock />{d.name}</button>
              }
              return (
                <button key={d.id} role="tab" aria-selected={dept === d.name} className={`fchip ${dept === d.name ? 'on' : ''}`} onClick={() => setDept(d.name)}>
                  {d.name}{a === 'own' ? '' : ' · view-only'} <span className="fchip-n">{count(d.name)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="row spread">
          <span className="hint num">{rows.length} result{rows.length === 1 ? '' : 's'}{dept !== 'all' && ` in ${dept}`}</span>
          <span className="hint row" style={{ gap: 6 }}><Lock size={12} />Locked libraries need access from your Institute Admin</span>
        </div>

        {rows.length === 0
          ? <div className="card"><Empty icon={<SearchX />} title="No approved processes match" body="Try a different keyword or clear filters. Results only include libraries you have access to." /></div>
          : groups.map(([d, list]) => (
            <section key={d.id} className="stack gap2" aria-label={d.name}>
              <div className="row gap2" style={{ alignItems: 'baseline' }}>
                <h3 style={{ fontSize: 15 }}>{d.name}</h3>
                <span className="hint">{ACCESS[d.name] === 'own' ? 'Your department' : 'View-only'} · {list.length}</span>
              </div>
              <div className="card-grid">{list.map(card)}</div>
            </section>
          ))}
      </div>
    </>
  )
}
