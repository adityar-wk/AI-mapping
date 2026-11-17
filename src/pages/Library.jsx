import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Lock, X, SearchX } from 'lucide-react'
import { Topbar } from '../App'
import { PROCESSES, DEPARTMENTS, CATEGORIES, fmtDate } from '../data'
import { Empty } from '../components/ui'
import ProcessCard from '../components/ProcessCard'

const OWN = 'Office of Sponsored Programs'
// access for Maria: own dept + granted (user-level Registrar, dept-level Career, Marketing); Financial Aid restricted
const ACCESS = { [OWN]: 'own', 'Office of the Registrar': 'granted', 'Career Services': 'granted', 'Marketing & Communications': 'granted', 'Continuing Education': 'granted', 'Financial Aid': 'none' }

export default function LibraryPage() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('all')
  const [cat, setCat] = useState('')
  const [creator, setCreator] = useState('')
  const [since, setSince] = useState('')
  const [tag, setTag] = useState('')

  const approved = PROCESSES.filter((p) => p.status === 'approved' || p.approvedVersion)
  const visible = approved.filter((p) => ACCESS[p.dept] && ACCESS[p.dept] !== 'none')
  const creators = [...new Set(visible.map((p) => p.creator))]
  const tags = [...new Set(visible.flatMap((p) => p.tags))]

  const rows = useMemo(() => visible.filter((p) => {
    const s = q.toLowerCase()
    if (s && !(p.name.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s)) || p.category.toLowerCase().includes(s))) return false
    if (dept !== 'all' && p.dept !== dept) return false
    if (cat && p.category !== cat) return false
    if (creator && p.creator !== creator) return false
    if (tag && !p.tags.includes(tag)) return false
    if (since) { const d = { '30': 30, '90': 90, '365': 365 }[since]; if ((new Date('2026-11-17') - new Date(p.updated)) / 864e5 > d) return false }
    return true
  }), [q, dept, cat, creator, since, tag])

  const active = [cat, creator, since, tag].filter(Boolean).length
  const deptList = DEPARTMENTS.filter((d) => ACCESS[d.name])
  const count = (name) => visible.filter((p) => p.dept === name).length

  return (
    <>
      <Topbar title="Process library" />
      <div className="page">
        <p className="lede muted">Approved processes only. Each opens at its current approved version, with earlier versions in its history.</p>

        <div className="stack gap4">
          <div className="row wrap gap2">
            <div className="search" style={{ width: 340 }}><Search /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, keyword or tag" aria-label="Search processes" /></div>
            <Filter label="Category" value={cat} set={setCat} options={CATEGORIES} />
            <Filter label="Tag" value={tag} set={setTag} options={tags} />
            <Filter label="Creator" value={creator} set={setCreator} options={creators} />
            <Filter label="Last updated" value={since} set={setSince} options={[['30', 'Past 30 days'], ['90', 'Past 90 days'], ['365', 'Past year']]} />
            {active > 0 && <button className="btn ghost sm" onClick={() => { setCat(''); setCreator(''); setSince(''); setTag('') }}><X />Clear {active}</button>}
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
                  {d.name}{a === 'own' ? '' : d.status === 'Archived' ? ' · archived' : ' · view-only'} <span className="fchip-n">{count(d.name)}</span>
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
          : <div className="card-grid">{rows.map((p) => <ProcessCard key={p.id} p={p} own={ACCESS[p.dept] === 'own'} showDept onOpen={() => nav(`/process/${p.id}`)} />)}</div>}
      </div>
    </>
  )
}

function Filter({ label, value, set, options }) {
  return (
    <select className="select" style={{ width: 'auto', height: 38, fontSize: 13, background: value ? 'var(--well)' : undefined, borderColor: value ? 'var(--focus-border)' : undefined }} value={value} onChange={(e) => set(e.target.value)} aria-label={label}>
      <option value="">{label}: any</option>
      {options.map((o) => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

