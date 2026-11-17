import { useNavigate } from 'react-router-dom'
import { AlertTriangle, UserX, UserPlus } from 'lucide-react'
import { Topbar } from '../../App'
import { USERS, SUPERVISORS, PROCESSES } from '../../data'
import { Avatar } from '../../components/ui'

const DEPT = 'Office of Sponsored Programs'

export default function DeptDashboard() {
  const nav = useNavigate()
  const procs = PROCESSES.filter((p) => p.dept === DEPT)
  const by = (s) => procs.filter((p) => p.status === s).length
  const total = 22
  const split = [['approved', 15, 'var(--approved)', 'Approved'], ['review', 3, 'var(--navy)', 'Under review'], ['returned', 1, 'var(--returned)', 'Returned'], ['draft', 3, 'var(--ink-4)', 'Draft']]

  return (
    <>
      <Topbar title="Department summary">
        <button className="btn primary" onClick={() => nav('/dept/people?new=1')}><UserPlus />Add person</button>
      </Topbar>
      <div className="page">
        <div className="page-head">
          <div><p className="lede">People, reporting lines and processes in {DEPT}</p></div>
        </div>

        <div className="ledger" style={{ '--cols': 3 }}>
          <div><span className="eyebrow">Users</span><span className="big">14</span><span className="sub">12 active · 1 invited · 1 deactivated</span></div>
          <div><span className="eyebrow">Supervisors</span><span className="big">3</span><span className="sub">2 active · 1 invited · 1 deactivated (history kept)</span></div>
          <div>
            <span className="eyebrow">Processes</span><span className="big">{total}</span>
            <div className="stackbar" style={{ marginTop: 6 }}>{split.map(([k, n, c]) => <i key={k} style={{ width: `${(n / total) * 100}%`, background: c }} title={`${n} ${k}`} />)}</div>
            <span className="sub row wrap" style={{ gap: 10, marginTop: 2 }}>{split.map(([k, n, c, l]) => <span key={k} className="row" style={{ gap: 4 }}><i style={{ width: 6, height: 6, borderRadius: 2, background: c }} />{n} {l.toLowerCase()}</span>)}</span>
          </div>
        </div>

          <div className="card">
            <div className="card-head"><h3>Needs attention</h3><span className="tag returned">2</span></div>
            <div className="list-row" style={{ alignItems: 'flex-start' }}>
              <AlertTriangle size={16} color="var(--returned)" style={{ marginTop: 2 }} />
              <div className="stack grow gap1"><span className="small"><b>Nora Feld</b> has no supervisor. Her submissions would have no reviewer.</span><button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/dept/people')}>Assign supervisor</button></div>
            </div>
            <div className="list-row" style={{ alignItems: 'flex-start' }}>
              <UserX size={16} color="var(--returned)" style={{ marginTop: 2 }} />
              <div className="stack grow gap1"><span className="small"><b>Ian Whitaker</b> was deactivated with 1 unfinished draft. Transfer it so the work isn’t stranded.</span><button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/dept/people')}>Transfer draft</button></div>
            </div>
          </div>
      </div>
    </>
  )
}
