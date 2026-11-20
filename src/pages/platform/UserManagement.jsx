import { useState } from 'react'
import { Plus, Search, Eye } from 'lucide-react'
import { Topbar } from '../../App'
import { CreateAdmin, AdminProfile, adminName, statusTag } from '../../components/AdminForm'
import { usePlatform, platform } from './store'

// Super Admin → User management: onboard and maintain Institute Admins.
// Field rules follow cc-superadmin-web UserForm; the email must use the selected institute's domain.

const instituteScope = (institutes) => ({
  key: 'instituteId', label: 'Institute', role: 'Institute Admin',
  options: institutes.map((i) => ({ id: i.id, name: i.name, disabled: i.status !== 'Active', note: i.status !== 'Active' ? i.status : '' })),
  domainOf: (id) => institutes.find((i) => i.id === id)?.domain,
  pickHint: 'One institute per user. Suspended and archived institutes can’t be selected.',
  lockHint: 'An admin’s institute can’t be changed. Create a new user for another institute.',
})

export default function UserManagement() {
  const { institutes, admins } = usePlatform()
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState(null)
  const instName = (id) => institutes.find((i) => i.id === id)?.name || '—'
  const rows = admins.filter((a) => !q || `${adminName(a)} ${instName(a.instituteId)} ${a.email}`.toLowerCase().includes(q.toLowerCase()))
  const open = admins.find((a) => a.id === openId)
  const scope = instituteScope(institutes)

  return (
    <>
      <Topbar title="User management">
        <button className="btn primary" onClick={() => setCreating(true)}><Plus />Create user</button>
      </Topbar>
      <div className="page">
        <p className="lede muted">Institute Admins onboarded on the platform. Each admin belongs to one institute and manages its departments and Department Admins.</p>
        <div className="row spread wrap gap2">
          <div className="search" style={{ width: 340 }}><Search /><input className="input" placeholder="Search by name, institute or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" /></div>
          <span className="hint num">{rows.length} of {admins.length} users</span>
        </div>
        <div className="card">
          <table className="table">
            <thead><tr><th style={{ width: 72 }}>Sr. No</th><th>Admin name</th><th>Institute name</th><th>Email ID</th><th className="right">Action</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 32 }}>{admins.length ? `No users match “${q}”.` : 'No Institute Admins yet. Use Create user to onboard one.'}</td></tr>}
              {rows.map((a, n) => (
                <tr key={a.id} className="clickable" onClick={() => setOpenId(a.id)}>
                  <td className="num ink2">{n + 1}</td>
                  <td><span className="row gap2"><span className="t-title">{adminName(a)}</span>{a.status !== 'Active' && statusTag(a.status)}</span></td>
                  <td>{instName(a.instituteId)}</td>
                  <td className="ink2">{a.email}</td>
                  <td className="right"><button className="btn sm" onClick={(e) => { e.stopPropagation(); setOpenId(a.id) }} aria-label={`View profile of ${adminName(a)}`}><Eye />View profile</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <CreateAdmin scope={scope} people={admins} onClose={() => setCreating(false)}
          sub="Onboard an Institute Admin. They get an email to activate their account (email OTP, then set a password) or can sign in with ADFS if it’s enabled."
          onCreate={(v) => platform.addAdmin({ ...v, id: `ia-${Date.now()}`, status: 'Invited', created: new Date().toISOString().slice(0, 10) })} />
      )}
      {open && <AdminProfile key={open.id} admin={open} scope={scope} people={admins} onSave={platform.updateAdmin} onClose={() => setOpenId(null)} />}
    </>
  )
}
