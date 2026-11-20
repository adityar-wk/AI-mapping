import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, MoreHorizontal, PenLine, Archive, Ban, Search, UserPlus, Replace } from 'lucide-react'
import { Topbar } from '../../App'
import { GRANTS, INSTITUTE } from '../../data'
import { Tag, Dropdown, Modal, FilterButton, useToast } from '../../components/ui'
import { adminName } from '../../components/AdminForm'
import { useInstitute, inst, adminsOf } from './store'
import ChangeAdmin from './ChangeAdmin'

export const deptTag = (s) => <Tag kind={s === 'Active' ? 'approved' : 'draft'}>{s}</Tag>

const STATUSES = ['All', 'Active', 'Archived']

/* Institute Admin home: KPIs + the departments table.
   A department is only a name + description (POST /departments). Its admins are separate users,
   created on the Department admins page (POST /departments/:id/admins); this page only shows them. */
export default function InstOverview() {
  const [qs] = useSearchParams()
  const toast = useToast()
  const nav = useNavigate()
  const { departments, admins } = useInstitute()
  const [dlg, setDlg] = useState(qs.get('new') ? { kind: 'create' } : null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [admin, setAdmin] = useState('any')

  const names = (d) => adminsOf(admins, d.id).map(adminName)
  const sum = (k) => departments.reduce((a, d) => a + d[k], 0)
  const count = (s) => (s === 'All' ? departments.length : departments.filter((d) => d.status === s).length)
  const noAdminCount = departments.filter((d) => d.status === 'Active' && names(d).length === 0).length
  const rows = departments.filter((d) =>
    (status === 'All' || d.status === status) &&
    (admin === 'any' || (admin === 'none') === (names(d).length === 0)) &&
    (!q || `${d.name} ${d.desc} ${names(d).join(' ')}`.toLowerCase().includes(q.toLowerCase())))

  return (
    <>
      <Topbar title="Overview">
        <button className="btn primary" onClick={() => setDlg({ kind: 'create' })}><Plus />New department</button>
      </Topbar>
      <div className="page">
        <p className="lede muted">Departments, people and library access across your institute · tenant <span className="mono">{INSTITUTE.tenant}</span></p>

        <div className="ledger">
          <div><span className="eyebrow">Departments</span><span className="big">{departments.length}</span><span className="sub">{count('Active')} active · {count('Archived')} archived{noAdminCount ? ` · ${noAdminCount} without an admin` : ''}</span></div>
          <div><span className="eyebrow">People</span><span className="big">{sum('users') + sum('supervisors')}</span><span className="sub">{sum('users')} users · {sum('supervisors')} supervisors</span></div>
          <div><span className="eyebrow">Processes</span><span className="big">{sum('processes')}</span><span className="sub">across all departments</span></div>
          <div><span className="eyebrow">Library grants</span><span className="big">{GRANTS.length}</span><span className="sub">cross-department, view-only</span></div>
        </div>

        <div className="stack gap4">
          <h2 style={{ fontSize: 16 }}>Departments</h2>
          <div className="row gap2 wrap">
            <div className="search" style={{ width: 340 }}><Search /><input className="input" placeholder="Search departments or admins" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search departments" /></div>
            <FilterButton
              groups={[
                { key: 'status', label: 'Status', options: STATUSES.map((x) => [x, `${x === 'All' ? 'Any status' : x} · ${count(x)}`]) },
                { key: 'admin', label: 'Department admin', options: [['any', 'Any'], ['assigned', 'Assigned'], ['none', 'Not assigned']] },
              ]}
              values={{ status, admin }}
              onChange={(k, v) => (k === 'status' ? setStatus(v) : setAdmin(v))}
              onClear={() => { setStatus('All'); setAdmin('any') }} />
            <span className="hint num" style={{ marginLeft: 'auto' }}>{rows.length} of {departments.length} departments</span>
          </div>

          <div className="card">
            <table className="table">
              <thead><tr><th style={{ width: '26%' }}>Department</th><th>Department admin</th><th>Users</th><th>Supervisors</th><th>Processes</th><th>Status</th><th className="actions">Actions</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 32 }}>No departments match these filters.</td></tr>}
                {rows.map((d) => {
                  const who = names(d)
                  return (
                    <tr key={d.id}>
                      <td><div className="stack" style={{ gap: 2 }}><span className="t-title">{d.name}</span><span className="hint">{d.desc}</span></div></td>
                      <td>
                        {who.length ? who.join(', ')
                          : d.status === 'Active'
                            ? <Link className="row gap1 small" style={{ gap: 4 }} to={`/institute/admins?new=${d.id}`}><UserPlus size={14} />Add admin</Link>
                            : <span className="muted">—</span>}
                      </td>
                      <td className="num">{d.users}</td>
                      <td className="num">{d.supervisors}</td>
                      <td className="num">{d.processes}</td>
                      <td>{deptTag(d.status)}</td>
                      <td className="actions">
                        <Dropdown width={240} trigger={({ toggle }) => <button className="btn ghost sm icon" onClick={toggle} aria-label={`Actions for ${d.name}`}><MoreHorizontal /></button>}>
                          <button onClick={() => setDlg({ kind: 'edit', d })}><PenLine />Edit name and description</button>
                          {d.status === 'Active' && (who.length
                            ? <button onClick={() => setDlg({ kind: 'change', d })}><Replace />Change department admin</button>
                            : <button onClick={() => nav(`/institute/admins?new=${d.id}`)}><UserPlus />Add department admin</button>)}
                          {d.status !== 'Archived' && <button onClick={() => setDlg({ kind: 'archive', d })}><Archive />Archive department</button>}
                        </Dropdown>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="hint">Departments are never deleted. Archive them instead so approved processes and audit records stay available. Department admins are managed on the <Link to="/institute/admins">Department admins</Link> page.</p>
        </div>
      </div>

      {(dlg?.kind === 'create' || dlg?.kind === 'edit') && (
        <DepartmentDialog d={dlg.d} departments={departments} onClose={() => setDlg(null)}
          onSave={(v) => {
            if (dlg.d) { inst.updateDepartment(dlg.d.id, v); toast('Department updated') }
            else { inst.addDepartment({ ...v, id: `d-${Date.now()}`, users: 0, supervisors: 0, processes: 0, status: 'Active' }); toast(`${v.name} created — add its admin from Department admins`) }
            setDlg(null)
          }} />
      )}
      {dlg?.kind === 'change' && <ChangeAdmin dept={dlg.d} admins={admins} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'archive' && (() => {
        const people = dlg.d.users + dlg.d.supervisors
        const adms = adminsOf(admins, dlg.d.id).length
        const blocked = people + adms > 0
        return (
          <Modal title={`Archive ${dlg.d.name}?`} sub="Archived departments can’t receive new people or assignments." onClose={() => setDlg(null)}
            foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" disabled={blocked} onClick={() => { inst.updateDepartment(dlg.d.id, { status: 'Archived' }); setDlg(null); toast('Department archived') }}><Archive />Archive</button></>}>
            {blocked
              ? <div className="notice warn"><Ban /><span><b>{people + adms} people still hold a role here</b> ({people} users and supervisors, {adms} department admins). Reassign or deactivate them, and resolve pending reviews, before archiving.</span></div>
              : <p className="ink2">Its {dlg.d.processes} approved processes, versions and audit history are kept and stay viewable to people with access.</p>}
          </Modal>
        )
      })()}
    </>
  )
}

function DepartmentDialog({ d, departments, onSave, onClose }) {
  const [name, setName] = useState(d?.name || '')
  const [desc, setDesc] = useState(d?.desc || '')
  const [err, setErr] = useState('')
  const save = () => {
    const n = name.trim()
    let e = ''
    if (!n) e = 'Department name is required'
    else if (n.length < 2 || n.length > 100) e = 'Name must be 2–100 characters'
    else if (departments.some((x) => x.id !== d?.id && x.status === 'Active' && x.name.toLowerCase() === n.toLowerCase())) e = 'An active department already has this name'
    setErr(e)
    if (!e) onSave({ name: n, desc: desc.trim() })
  }
  return (
    <Modal title={d ? `Edit ${d.name}` : 'New department'} onClose={onClose}
      sub={d ? undefined : 'Creates the department only. Add its Department Admin afterwards from the Department admins page.'}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}>{d ? 'Save changes' : 'Create department'}</button></>}>
      <div className="field"><label htmlFor="d-name">Name</label><input id="d-name" className="input" maxLength={100} value={name} onChange={(e) => { setName(e.target.value); setErr('') }} placeholder="e.g. Office of Student Affairs" />{err && <span className="field-err" role="alert">{err}</span>}</div>
      <div className="field"><label htmlFor="d-desc">Description<span className="opt">Optional</span></label><textarea id="d-desc" className="textarea" maxLength={500} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What this department is responsible for" /></div>
    </Modal>
  )
}
