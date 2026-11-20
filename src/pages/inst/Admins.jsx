import { useState } from 'react'
import { KeyRound, Replace, UserPlus, ShieldCheck, Loader2, MoreHorizontal } from 'lucide-react'
import { Topbar } from '../../App'
import { DEPARTMENTS } from '../../data'
import { Avatar, Modal, Tag, Dropdown, useToast } from '../../components/ui'

export default function DeptAdmins() {
  const toast = useToast()
  const [dlg, setDlg] = useState(null)
  const [busy, setBusy] = useState(false)
  const rows = DEPARTMENTS.filter((d) => d.status !== 'Archived')
  return (
    <>
      <Topbar title="Department admins" />
      <div className="page">
        <div className="page-head"><div><p className="lede">Each department has one admin who manages its users and supervisors. Admin rights don’t include editing or approving processes.</p></div></div>
        <div className="card">
          <table className="table">
            <thead><tr><th>Department</th><th>Admin</th><th>Institutional email</th><th>Status</th><th className="actions">Actions</th></tr></thead>
            <tbody>
              {rows.map((d) => {
                const none = d.admin === '—'
                const email = none ? '' : `${d.admin.split(' ')[0][0].toLowerCase()}${d.admin.split(' ')[1].toLowerCase()}@udallas.edu`
                return (
                  <tr key={d.id}>
                    <td className="t-title">{d.name}</td>
                    <td>
                      {none ? <span className="muted">Not assigned</span> : <span className="row gap2"><Avatar name={d.admin} sm />{d.admin}</span>}
                    </td>
                    <td className="ink2">{email || '—'}</td>
                    <td>{none ? <Tag kind="returned">Needs admin</Tag> : <Tag kind="approved">Active</Tag>}</td>
                    <td className="actions">
                      <Dropdown width={200} trigger={({ toggle }) => <button className="btn ghost sm icon" onClick={toggle} aria-label={`Actions for ${d.name}`}><MoreHorizontal /></button>}>
                        {none ? (
                          <button onClick={() => setDlg({ kind: 'assign', d })}><UserPlus />Assign admin</button>
                        ) : (
                          <>
                            <button onClick={() => setDlg({ kind: 'assign', d })}><Replace />Replace admin</button>
                            <button onClick={() => setDlg({ kind: 'reset', d })}><KeyRound />Reset password</button>
                          </>
                        )}
                      </Dropdown>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {dlg?.kind === 'assign' && (
        <Modal title={`${dlg.d.admin === '—' ? 'Assign' : 'Replace'} admin for ${dlg.d.name}`} onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" onClick={() => { setDlg(null); toast('Department admin updated') }}>Save</button></>}>
          {dlg.d.admin !== '—' && <p className="ink2 small">{dlg.d.admin} will lose admin access to this department.</p>}
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="field"><label>Full name</label><input className="input" /></div>
            <div className="field"><label>Institutional email</label><input className="input" placeholder="name@udallas.edu" /></div>
          </div>
          <span className="hint row gap1" style={{ gap: 6 }}><ShieldCheck size={12} />Linked to their UD ADFS account. They’ll get an invitation email.</span>
        </Modal>
      )}
      {dlg?.kind === 'reset' && (
        <Modal title={`Reset password for ${dlg.d.admin}?`} sub="Runs through UD’s identity management. Process Atlas never sets or sees the password." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" disabled={busy} onClick={() => { setBusy(true); setTimeout(() => { setBusy(false); setDlg(null); toast(`Reset link sent to ${dlg.d.admin}`) }, 900) }}>{busy ? <><Loader2 className="spin" />Requesting…</> : <><KeyRound />Send reset</>}</button></>}>
          <p className="ink2">{dlg.d.admin} will receive UD’s standard reset instructions at their institutional email. Their current sign-in stays valid until they change it.</p>
        </Modal>
      )}
    </>
  )
}
