import { useState } from 'react'
import { Replace, UserPlus, Users, Info } from 'lucide-react'
import { Modal, useToast } from '../../components/ui'
import { AdminFields, useAdminForm, emptyAdmin, clean, adminName } from '../../components/AdminForm'
import { SUPERVISORS, USERS } from '../../data'
import { inst, adminsOf, departmentScope } from './store'

// Change a department's admin: PUT /departments/:id/admins/:userId  { newUserId } | { newUser }
// One transaction: revoke the old role_assignment(DEPT_ADMIN) and grant it to the new person.
// The old person's account is NOT deactivated (they may hold other roles); their DEPT_ADMIN
// permission for this department stops at once (their sessions are refreshed).
// The department itself is not touched.

// People already in the department who can be promoted. (Design data: only OSP has a people list.)
const peopleIn = (deptId) => (deptId === 'osp'
  ? [...SUPERVISORS.map((p) => ({ ...p, role: 'Supervisor' })), ...USERS.map((p) => ({ ...p, role: 'User' }))].filter((p) => p.status === 'Active')
  : [])

export default function ChangeAdmin({ dept, admins, onClose }) {
  const toast = useToast()
  const current = adminsOf(admins, dept.id)
  const [oldId, setOldId] = useState(current[0]?.id || '')
  const candidates = peopleIn(dept.id).filter((p) => !admins.some((a) => a.email === p.email && a.status !== 'Deactivated'))
  const [mode, setMode] = useState(candidates.length ? 'existing' : 'new')
  const [pick, setPick] = useState('')
  const [pickErr, setPickErr] = useState('')
  const scope = { ...departmentScope([dept]), lockHint: `They become the admin of ${dept.name}.` }
  const f = useAdminForm(emptyAdmin(scope, dept.id), { scope, people: admins })
  const old = current.find((a) => a.id === oldId)

  const save = () => {
    const today = new Date().toISOString().slice(0, 10)
    let next
    if (mode === 'existing') {
      const p = candidates.find((c) => c.id === pick)
      if (!p) { setPickErr('Select a person'); return }
      // Existing account: same profile, already active, so no invitation; they get a "you are now an admin" email.
      const { firstName, lastName, email, countryCode, phone } = p
      next = { departmentId: dept.id, firstName, lastName, email, countryCode, phone, id: `da-${Date.now()}`, status: 'Active', created: today }
    } else {
      if (!f.check()) return
      const { address, country, state, city, zipcode, ...contact } = clean(f.v)
      next = { ...contact, id: `da-${Date.now()}`, status: 'Invited', created: today }
    }
    inst.replaceAdmin(oldId, next)
    onClose()
    toast(`${adminName(next)} is now the admin of ${dept.name}${mode === 'new' ? ' — invitation sent' : ''}`)
  }

  return (
    <Modal lg title={`Change admin for ${dept.name}`} onClose={onClose}
      sub="Moves the Department Admin role to another person. The department, its people and its processes are not changed."
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}><Replace />Change admin</button></>}>
      {current.length > 1 ? (
        <div className="field"><label htmlFor="c-old">Admin to replace</label>
          <select id="c-old" className="select" value={oldId} onChange={(e) => setOldId(e.target.value)}>
            {current.map((a) => <option key={a.id} value={a.id}>{adminName(a)} · {a.email}</option>)}
          </select>
        </div>
      ) : (
        <div className="field"><span className="label">Current admin</span><span>{adminName(old)} <span className="muted">· {old.email}</span></span></div>
      )}

      <div className="divider" />
      <div className="row spread wrap gap2">
        <span className="label">New admin</span>
        <div className="seg" role="tablist" aria-label="New admin source">
          <button role="tab" className={mode === 'existing' ? 'on' : ''} disabled={!candidates.length} onClick={() => setMode('existing')}><Users />Someone in this department</button>
          <button role="tab" className={mode === 'new' ? 'on' : ''} onClick={() => setMode('new')}><UserPlus />New person</button>
        </div>
      </div>

      {mode === 'existing' ? (
        <div className="field"><label htmlFor="c-pick">Person</label>
          <select id="c-pick" className="select" value={pick} onChange={(e) => { setPick(e.target.value); setPickErr('') }}>
            <option value="">Select a supervisor or user</option>
            {candidates.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.role} · {p.email}</option>)}
          </select>
          {pickErr ? <span className="field-err" role="alert">{pickErr}</span> : <span className="hint">They keep their current role and also become Department Admin. No new account or invitation is needed.</span>}
        </div>
      ) : (
        <AdminFields v={f.v} set={f.set} errors={f.errors} scope={scope} lockScope />
      )}

      <div className="notice"><Info /><span><b>{old ? adminName(old) : 'The current admin'}</b> loses Department Admin access to {dept.name} immediately. Their account stays active if they have other roles. Both people get an email.</span></div>
    </Modal>
  )
}
