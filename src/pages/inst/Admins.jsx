import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Eye } from 'lucide-react'
import { Topbar } from '../../App'
import { CreateAdmin, AdminProfile, adminName, statusTag } from '../../components/AdminForm'
import { useInstitute, inst, departmentScope } from './store'

// Institute Admin → Department admins: onboard and maintain Department Admins.
// Separate from creating a department: POST /departments/:id/admins creates
// app_user (INVITED) + role_assignment(DEPT_ADMIN) + an invitation email.
// Address fields aren't collected for Department Admins.
const strip = ({ address, country, state, city, zipcode, ...rest }) => rest

export default function DeptAdmins() {
  const { departments, admins } = useInstitute()
  const [qs, setQs] = useSearchParams()
  const preset = qs.get('new')
  const [creating, setCreating] = useState(preset !== null)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const scope = departmentScope(departments)
  const deptName = (id) => departments.find((d) => d.id === id)?.name || '—'
  const rows = admins.filter((a) => !q || `${adminName(a)} ${deptName(a.departmentId)} ${a.email}`.toLowerCase().includes(q.toLowerCase()))
  const open = admins.find((a) => a.id === openId)
  const closeCreate = () => { setCreating(false); if (preset !== null) setQs({}, { replace: true }) }

  return (
    <>
      <Topbar title="Department admins">
        <button className="btn primary" onClick={() => setCreating(true)}><Plus />Create user</button>
      </Topbar>
      <div className="page">
        <p className="lede muted">Department Admins manage the users and supervisors of their department. Admin rights don’t include editing or approving processes.</p>
        <div className="row spread wrap gap2">
          <div className="search" style={{ width: 340 }}><Search /><input className="input" placeholder="Search by name, department or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search department admins" /></div>
          <span className="hint num">{rows.length} of {admins.length} admins</span>
        </div>
        <div className="card">
          <table className="table">
            <thead><tr><th style={{ width: 72 }}>Sr. No</th><th>Admin name</th><th>Department</th><th>Email ID</th><th className="right">Action</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 32 }}>{admins.length ? `No admins match “${q}”.` : 'No Department Admins yet. Use Create user to onboard one.'}</td></tr>}
              {rows.map((a, n) => (
                <tr key={a.id} className="clickable" onClick={() => setOpenId(a.id)}>
                  <td className="num ink2">{n + 1}</td>
                  <td><span className="row gap2"><span className="t-title">{adminName(a)}</span>{a.status !== 'Active' && statusTag(a.status)}</span></td>
                  <td>{deptName(a.departmentId)}</td>
                  <td className="ink2">{a.email}</td>
                  <td className="right"><button className="btn sm" onClick={(e) => { e.stopPropagation(); setOpenId(a.id) }} aria-label={`View profile of ${adminName(a)}`}><Eye />View profile</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <CreateAdmin scope={scope} people={admins} preset={preset || ''} onClose={closeCreate}
          sub="Onboard a Department Admin. They get an email to activate their account (email OTP, then set a password) or can sign in with ADFS if it’s enabled."
          onCreate={(v) => inst.addAdmin({ ...strip(v), id: `da-${Date.now()}`, status: 'Invited', created: new Date().toISOString().slice(0, 10) })} />
      )}
      {open && <AdminProfile key={open.id} admin={open} scope={scope} people={admins} onSave={inst.updateAdmin} onClose={() => setOpenId(null)} />}
    </>
  )
}
