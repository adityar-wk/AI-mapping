import { useState } from 'react'
import { Ban, Search, RotateCcw, MoreHorizontal, ShieldCheck } from 'lucide-react'
import { Topbar } from '../../App'
import { Avatar, Modal, Dropdown, Empty, useToast } from '../../components/ui'

/* Everyone in the institute who could be suspended (searched in the suspend dialog only) */
const PEOPLE = [
  { id: 1, name: 'Maria Okafor', role: 'User', dept: 'Office of Sponsored Programs' },
  { id: 2, name: 'Daniel Reyes', role: 'Supervisor', dept: 'Office of Sponsored Programs' },
  { id: 3, name: 'Rosa Diaz', role: 'User', dept: 'Office of the Registrar' },
  { id: 5, name: 'Jonah Pierce', role: 'Department Admin', dept: 'Career Services' },
  { id: 6, name: 'Sara Lindqvist', role: 'Department Admin', dept: 'Marketing & Communications' },
  { id: 7, name: 'Leo Brandt', role: 'User', dept: 'Office of Sponsored Programs' },
]

/* This page lists suspended people only. Everyday user management lives with Department Admins. */
const SUSPENDED = [
  { id: 4, name: 'Carl Jensen', role: 'User', dept: 'Financial Aid', since: 'Nov 3, 2026', by: 'Thomas Healy', reason: 'Leave of absence' },
  { id: 8, name: 'Priya Shah', role: 'Supervisor', dept: 'Office of the Registrar', since: 'Oct 21, 2026', by: 'Thomas Healy', reason: 'Under HR review' },
]

export default function Suspensions() {
  const toast = useToast()
  const [suspended, setSuspended] = useState(SUSPENDED)
  const [dlg, setDlg] = useState(null)
  const [q, setQ] = useState('')
  const rows = suspended.filter((p) => !q || `${p.name} ${p.dept}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <Topbar title="User suspension">
        <button className="btn primary" onClick={() => setDlg({ kind: 'suspend' })}><Ban />Suspend a user</button>
      </Topbar>
      <div className="page">
        <p className="lede muted">People whose Process Atlas access is currently suspended. Suspending ends their sessions at once and blocks every request until restored; their UD account isn’t affected. To add or edit people, use the department’s Users & supervisors page.</p>

        <div className="row gap2 wrap">
          <div className="search" style={{ width: 340 }}><Search /><input className="input" placeholder="Search suspended users" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search suspended users" /></div>
          <span className="hint num" style={{ marginLeft: 'auto' }}>{suspended.length} suspended</span>
        </div>

        <div className="card">
          {suspended.length === 0 ? (
            <Empty icon={<ShieldCheck />} title="No one is suspended" body="Use “Suspend a user” to block someone’s access immediately." />
          ) : (
            <table className="table">
              <thead><tr><th>Person</th><th>Role</th><th>Department</th><th>Reason</th><th>Suspended on</th><th>Suspended by</th><th className="actions">Actions</th></tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td><span className="row gap2"><Avatar name={p.name} sm /><span className="t-title">{p.name}</span></span></td>
                    <td className="ink2">{p.role}</td>
                    <td className="ink2">{p.dept}</td>
                    <td>{p.reason}</td>
                    <td className="ink2 num">{p.since}</td>
                    <td className="ink2">{p.by}</td>
                    <td className="actions">
                      <Dropdown width={200} trigger={({ toggle }) => <button className="btn ghost sm icon" onClick={toggle} aria-label={`Actions for ${p.name}`}><MoreHorizontal /></button>}>
                        <button onClick={() => setDlg({ kind: 'restore', p })}><RotateCcw />Restore access</button>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 32 }}>No suspended users match “{q}”.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {dlg?.kind === 'suspend' && (
        <SuspendDialog people={PEOPLE.filter((x) => !suspended.some((s) => s.id === x.id))} onClose={() => setDlg(null)}
          onDone={(p, reason) => { setSuspended((s) => [{ ...p, since: 'Nov 17, 2026', by: 'Thomas Healy', reason: reason || '—' }, ...s]); setDlg(null); toast(`${p.name} suspended — sessions revoked`) }} />
      )}
      {dlg?.kind === 'restore' && (
        <Modal title={`Restore access for ${dlg.p.name}?`} sub="They can sign in again straight away with their UD account." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" onClick={() => { setSuspended((s) => s.filter((x) => x.id !== dlg.p.id)); setDlg(null); toast(`${dlg.p.name} restored`) }}><RotateCcw />Restore access</button></>}>
          <p className="ink2">Their drafts, approvals and history were kept while suspended.</p>
        </Modal>
      )}
    </>
  )
}

function SuspendDialog({ people, onClose, onDone }) {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(null)
  const [reason, setReason] = useState('')
  const list = people.filter((p) => !q || `${p.name} ${p.dept}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Modal title="Suspend a user" sub="Open sessions end immediately; drafts, approvals and history are untouched." onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn danger solid" disabled={!pick} onClick={() => onDone(pick, reason)}><Ban />Suspend {pick ? pick.name.split(' ')[0] : ''}</button></>}>
      <div className="field"><label>Person</label>
        <div className="search"><Search /><input className="input" placeholder="Search anyone in the institute" value={q} onChange={(e) => setQ(e.target.value)} autoFocus /></div>
        <div className="pick-list" style={{ maxHeight: 220 }}>
          {list.map((p) => (
            <label key={p.id} className={`pick ${pick?.id === p.id ? 'on' : ''}`}>
              <input type="radio" name="who" checked={pick?.id === p.id} onChange={() => setPick(p)} />
              <Avatar name={p.name} sm />
              <span className="stack grow" style={{ gap: 0 }}><span style={{ fontWeight: 500 }}>{p.name}</span><span className="hint">{p.role} · {p.dept}</span></span>
            </label>
          ))}
          {list.length === 0 && <span className="hint" style={{ padding: 12 }}>No one matches.</span>}
        </div>
      </div>
      <div className="field"><label>Reason <span className="hint">(kept in the audit record)</span></label><input className="input" placeholder="e.g. Leave of absence" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
    </Modal>
  )
}
