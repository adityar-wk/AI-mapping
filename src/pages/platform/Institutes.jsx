import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Search, KeyRound } from 'lucide-react'
import { Topbar } from '../../App'
import { usePlatform, platform, adminName } from './store'
import { Modal, useToast } from '../../components/ui'
import { stTag, ssoTag, EMPTY, newTenant, validate, clean, InstituteFields, useInstituteForm } from './instituteParts'

// Super Admin → Institutes: the list and the "New institute" popup. Each row opens the
// institute's own page (InstituteDetail.jsx), where details, ADFS, admins and usage are managed.

export default function Institutes() {
  const toast = useToast()
  const nav = useNavigate()
  const { institutes: list, admins } = usePlatform()
  const adminsOf = (id) => admins.filter((a) => a.instituteId === id && a.status !== 'Deactivated')
  const [creating, setCreating] = useState(false)
  const [q, setQ] = useState('')
  const rows = list.filter((i) => !q || `${i.name} ${i.domain} ${i.tenant}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <Topbar title="Institutes">
        <button className="btn primary" onClick={() => setCreating(true)}><Plus />New institute</button>
      </Topbar>
      <div className="page">
        <p className="lede muted">Each institute is an isolated tenant: its people, departments, files and processes are never visible to another.</p>
        <div className="row spread wrap gap2">
          <div className="search" style={{ width: 340 }}><Search /><input className="input" placeholder="Search by name, domain or tenant ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search institutes" /></div>
          <span className="hint num">{rows.length} of {list.length} institutes</span>
        </div>
        <div className="card">
          <table className="table">
            <thead><tr><th>Institute</th><th>Tenant ID</th><th>Institute Admin</th><th>ADFS</th><th className="right">Users</th><th className="right">Processes</th><th>Status</th><th className="actions" /></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 32 }}>No institutes match “{q}”.</td></tr>}
              {rows.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => nav(`/platform/institutes/${i.id}`)}>
                  <td><div className="stack" style={{ gap: 0 }}><span className="t-title">{i.name}</span><span className="hint">{i.domain} · since {i.created}</span></div></td>
                  <td className="mono ink2">{i.tenant}</td>
                  <td>{adminsOf(i.id).map(adminName).join(', ') || <span style={{ color: 'var(--returned)' }}>Not assigned</span>}</td>
                  <td>{ssoTag(i.sso?.status || 'Not configured')}</td>
                  <td className="right num">{i.users}</td>
                  <td className="right num">{i.processes}</td>
                  <td>{stTag(i.status)}</td>
                  <td className="actions"><ChevronRight size={16} color="var(--ink-3)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creating && <CreateInstitute list={list} onClose={() => setCreating(false)} onCreate={(inst) => {
        platform.setInstitutes((l) => [inst, ...l]); setCreating(false)
        nav(`/platform/institutes/${inst.id}/adfs`)
        toast('Institute created. Set up ADFS here when its IT team sends the details, and add its admin.')
      }} />}
    </>
  )
}

function CreateInstitute({ list, onClose, onCreate }) {
  const [tenant] = useState(newTenant)
  const f = useInstituteForm(EMPTY)
  const check = (v) => validate(v, list)
  const set = (patch) => { f.set(patch); if (f.tried) f.setErrors(check({ ...f.v, ...patch })) }
  const submit = () => {
    f.setTried(true)
    const e = check(f.v); f.setErrors(e)
    if (Object.keys(e).length) return
    // ADFS is never part of creation: it's set up later on the institute's page (LLD §5.9).
    onCreate({ ...clean(f.v), sso: null, id: tenant, tenant, status: 'Active', users: 0, processes: 0, storage: 0, storageCap: 50, ai: 0, created: new Date().toISOString().slice(0, 10) })
  }
  return (
    <Modal lg title="New institute" sub="Creates a new isolated tenant with its own ID." onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={submit}>Create institute</button></>}>
      <InstituteFields v={f.v} set={set} errors={f.errors} tenant={tenant} />
      <div className="notice"><KeyRound /><span><b>ADFS sign-in is set up after the institute is created</b>, from the institute's page, once its IT team sends the details. Until then, people sign in with email and password.</span></div>
    </Modal>
  )
}

