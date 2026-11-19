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
  const total = procs.length
  const split = [['approved', by('approved'), 'var(--approved)', 'Approved'], ['review', by('review'), 'var(--navy)', 'Under review'], ['returned', by('returned'), 'var(--returned)', 'Returned'], ['draft', by('draft'), 'var(--ink-4)', 'Draft']].filter((x) => x[1] > 0)
  const st = (list, s) => list.filter((x) => x.status === s).length
  const breakdown = (list) => [['active', st(list, 'Active')], ['invited', st(list, 'Invited')], ['deactivated', st(list, 'Deactivated')]].filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(' · ')
  // attention items come from the records: no reviewer assigned, or drafts left by someone deactivated
  const noSup = USERS.filter((u) => !u.supervisor && u.status !== 'Deactivated')
  const stranded = USERS.filter((u) => u.status === 'Deactivated' && u.drafts > 0)

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
          <div><span className="eyebrow">Users</span><span className="big">{USERS.length}</span><span className="sub">{breakdown(USERS)}</span></div>
          <div><span className="eyebrow">Supervisors</span><span className="big">{SUPERVISORS.length}</span><span className="sub">{breakdown(SUPERVISORS)}</span></div>
          <div>
            <span className="eyebrow">Processes</span><span className="big">{total}</span>
            <div className="stackbar" style={{ marginTop: 6 }}>{split.map(([k, n, c]) => <i key={k} style={{ width: `${(n / total) * 100}%`, background: c }} title={`${n} ${k}`} />)}</div>
            <span className="sub row wrap" style={{ gap: 10, marginTop: 2 }}>{split.map(([k, n, c, l]) => <span key={k} className="row" style={{ gap: 4 }}><i style={{ width: 6, height: 6, borderRadius: 2, background: c }} />{n} {l.toLowerCase()}</span>)}</span>
          </div>
        </div>

          {noSup.length + stranded.length > 0 && (
            <div className="card">
              <div className="card-head"><h3>Needs attention</h3><span className="tag returned">{noSup.length + stranded.length}</span></div>
              {noSup.map((u) => (
                <div key={u.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <AlertTriangle size={16} color="var(--returned)" style={{ marginTop: 2 }} />
                  <div className="stack grow gap1"><span className="small"><b>{u.name}</b> has no supervisor, so their submissions would have no reviewer.</span><button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/dept/people')}>Assign supervisor</button></div>
                </div>
              ))}
              {stranded.map((u) => (
                <div key={u.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <UserX size={16} color="var(--returned)" style={{ marginTop: 2 }} />
                  <div className="stack grow gap1"><span className="small"><b>{u.name}</b> was deactivated with {u.drafts} unfinished draft{u.drafts > 1 ? 's' : ''}. Transfer {u.drafts > 1 ? 'them' : 'it'} so the work isn’t stranded.</span><button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/dept/people')}>Transfer draft</button></div>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  )
}
