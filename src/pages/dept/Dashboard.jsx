import { USERS, SUPERVISORS, PROCESSES } from '../../data'
import People from './People'

const DEPT = 'Office of Sponsored Programs'

/* The department admin's single page: the summary, then users, supervisors and teams right below. */
export default function DeptDashboard() {
  const procs = PROCESSES.filter((p) => p.dept === DEPT)
  const by = (s) => procs.filter((p) => p.status === s).length
  const total = procs.length
  const split = [['approved', by('approved'), 'var(--approved)', 'Approved'], ['review', by('review'), 'var(--navy)', 'Under review'], ['returned', by('returned'), 'var(--returned)', 'Returned'], ['draft', by('draft'), 'var(--ink-4)', 'Draft']].filter((x) => x[1] > 0)
  const st = (list, s) => list.filter((x) => x.status === s).length
  const breakdown = (list) => [['active', st(list, 'Active')], ['invited', st(list, 'Invited')], ['deactivated', st(list, 'Deactivated')]].filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(' · ')
  const teams = new Set(SUPERVISORS.filter((s) => s.status !== 'Deactivated').map((s) => s.team)).size

  const summary = (
    <div className="ledger" style={{ '--cols': 3 }}>
      <div><span className="eyebrow">Users</span><span className="big">{USERS.length}</span><span className="sub">{breakdown(USERS)}</span></div>
      <div><span className="eyebrow">Supervisors</span><span className="big">{SUPERVISORS.length}</span><span className="sub">{breakdown(SUPERVISORS)} · {teams} teams</span></div>
      <div>
        <span className="eyebrow">Processes</span><span className="big">{total}</span>
        <div className="stackbar" style={{ marginTop: 6 }}>{split.map(([k, n, c]) => <i key={k} style={{ width: `${(n / total) * 100}%`, background: c }} title={`${n} ${k}`} />)}</div>
        <span className="sub row wrap" style={{ gap: 10, marginTop: 2 }}>{split.map(([k, n, c, l]) => <span key={k} className="row" style={{ gap: 4 }}><i style={{ width: 6, height: 6, borderRadius: 2, background: c }} />{n} {l.toLowerCase()}</span>)}</span>
      </div>
    </div>
  )

  return <People title="Department" lede={`People, teams and processes in ${DEPT}. Profiles link to existing UD accounts; adding someone sends an invitation and they sign in with ADFS.`} summary={summary} />
}
