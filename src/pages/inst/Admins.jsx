import { useState } from 'react'
import { KeyRound, UserPlus, UserMinus, ShieldCheck, Loader2, MoreHorizontal, AlertTriangle } from 'lucide-react'
import { Topbar } from '../../App'
import { DEPARTMENTS, adminEmail } from '../../data'
import { Avatar, Modal, Tag, Dropdown, useToast } from '../../components/ui'

/* A department can have several admins; each one manages that department's users and supervisors. */
export default function DeptAdmins() {
  const toast = useToast()
  const [depts, setDepts] = useState(() => DEPARTMENTS.filter((d) => d.status !== 'Archived'))
  const [dlg, setDlg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })

  const add = (d) => {
    const name = form.name.trim()
    if (!name) return
    setDepts((list) => list.map((x) => (x.id === d.id ? { ...x, admins: [...x.admins, name] } : x)))
    setDlg(null); setForm({ name: '', email: '' }); toast(`${name} added as a department admin — invitation sent`)
  }
  const remove = (d, name) => {
    setDepts((list) => list.map((x) => (x.id === d.id ? { ...x, admins: x.admins.filter((a) => a !== name) } : x)))
    setDlg(null); toast(`${name} removed from ${d.name}`)
  }

  return (
    <>
      <Topbar title="Department admins" />
      <div className="page">
        <div className="page-head"><div><p className="lede">A department can have more than one admin. Each admin manages that department’s users and supervisors. Admin rights don’t include editing or approving processes.</p></div></div>
        <div className="card">
          <table className="table">
            <thead><tr><th style={{ width: '28%' }}>Department</th><th>Admin</th><th>Institutional email</th><th>Status</th><th className="actions">Actions</th></tr></thead>
            <tbody>
              {depts.map((d) => {
                const rows = d.admins.length ? d.admins : [null]
                return rows.map((a, i) => (
                  <tr key={`${d.id}-${a || 'none'}`} style={i ? { borderTop: 0 } : undefined}>
                    {i === 0 && (
                      <td rowSpan={rows.length} style={{ verticalAlign: 'top' }}>
                        <div className="stack" style={{ gap: 6 }}>
                          <span className="t-title">{d.name}</span>
                          <span className="hint">{d.admins.length} admin{d.admins.length === 1 ? '' : 's'}</span>
                          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setForm({ name: '', email: '' }); setDlg({ kind: 'add', d }) }}><UserPlus />Add admin</button>
                        </div>
                      </td>
                    )}
                    <td>{a ? <span className="row gap2"><Avatar name={a} sm />{a}</span> : <span className="muted">Not assigned</span>}</td>
                    <td className="ink2">{a ? adminEmail(a) : '—'}</td>
                    <td>{a ? <Tag kind="approved">Active</Tag> : <Tag kind="returned">Needs admin</Tag>}</td>
                    <td className="actions">
                      {a && (
                        <Dropdown width={210} trigger={({ toggle }) => <button className="btn ghost sm icon" onClick={toggle} aria-label={`Actions for ${a}`}><MoreHorizontal /></button>}>
                          <button onClick={() => setDlg({ kind: 'reset', d, a })}><KeyRound />Reset password</button>
                          <button onClick={() => setDlg({ kind: 'remove', d, a })} style={{ color: 'var(--brick)' }}><UserMinus style={{ color: 'var(--brick)' }} />Remove as admin</button>
                        </Dropdown>
                      )}
                    </td>
                  </tr>
                ))
              })}
            </tbody>
          </table>
        </div>
      </div>

      {dlg?.kind === 'add' && (
        <Modal title={`Add an admin to ${dlg.d.name}`} sub={dlg.d.admins.length ? `Current admins: ${dlg.d.admins.join(', ')}. They keep their access.` : 'This department has no admin yet.'} onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" disabled={!form.name.trim() || !form.email.trim()} onClick={() => add(dlg.d)}><UserPlus />Add admin</button></>}>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="field"><label>Full name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Institutional email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@udallas.edu" /></div>
          </div>
          <span className="hint row gap1" style={{ gap: 6 }}><ShieldCheck size={12} />Linked to their UD ADFS account. They’ll get an invitation email.</span>
        </Modal>
      )}
      {dlg?.kind === 'remove' && (
        <Modal title={`Remove ${dlg.a} as admin?`} sub={`${dlg.a} loses admin access to ${dlg.d.name}. Their history is kept.`} onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn danger solid" onClick={() => remove(dlg.d, dlg.a)}><UserMinus />Remove</button></>}>
          {dlg.d.admins.length === 1
            ? <div className="notice warn"><AlertTriangle /><span><b>This is the department’s only admin.</b> No one will be able to manage its users and supervisors until you add another.</span></div>
            : <p className="ink2">{dlg.d.admins.filter((x) => x !== dlg.a).join(', ')} will still manage this department.</p>}
        </Modal>
      )}
      {dlg?.kind === 'reset' && (
        <Modal title={`Reset password for ${dlg.a}?`} sub="Runs through UD’s identity management. Process Atlas never sets or sees the password." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" disabled={busy} onClick={() => { setBusy(true); setTimeout(() => { setBusy(false); setDlg(null); toast(`Reset link sent to ${dlg.a}`) }, 900) }}>{busy ? <><Loader2 className="spin" />Requesting…</> : <><KeyRound />Send reset</>}</button></>}>
          <p className="ink2">{dlg.a} will receive UD’s standard reset instructions at {adminEmail(dlg.a)}. Their current sign-in stays valid until they change it.</p>
        </Modal>
      )}
    </>
  )
}
