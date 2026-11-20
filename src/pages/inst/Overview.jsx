import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, MoreHorizontal, PenLine, Archive, Trash2, Ban, ShieldCheck, Search, UserCog } from 'lucide-react'
import { Topbar } from '../../App'
import { DEPARTMENTS, GRANTS, INSTITUTE } from '../../data'
import { Tag, Dropdown, Modal, FilterButton, useToast } from '../../components/ui'

export const deptTag = (s) => <Tag kind={s === 'Active' ? 'approved' : s === 'Archived' ? 'draft' : 'returned'}>{s}</Tag>

const STATUSES = ['All', 'Active', 'Setup pending', 'Archived']

/* Institute Admin home: KPIs + the one departments table, with every action inline */
export default function InstOverview() {
  const [qs] = useSearchParams()
  const toast = useToast()
  const [dlg, setDlg] = useState(qs.get('new') ? { kind: 'create' } : null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [admin, setAdmin] = useState('any')

  const sum = (k) => DEPARTMENTS.reduce((a, d) => a + d[k], 0)
  const count = (s) => (s === 'All' ? DEPARTMENTS.length : DEPARTMENTS.filter((d) => d.status === s).length)
  const rows = DEPARTMENTS.filter((d) =>
    (status === 'All' || d.status === status) &&
    (admin === 'any' || (admin === 'none') === (d.admin === '—')) &&
    (!q || `${d.name} ${d.desc} ${d.admin}`.toLowerCase().includes(q.toLowerCase())))

  return (
    <>
      <Topbar title="Overview">
        <button className="btn primary" onClick={() => setDlg({ kind: 'create' })}><Plus />New department</button>
      </Topbar>
      <div className="page">
        <p className="lede muted">Departments, people and library access across your institute · tenant <span className="mono">{INSTITUTE.tenant}</span></p>

        <div className="ledger">
          <div><span className="eyebrow">Departments</span><span className="big">{DEPARTMENTS.length}</span><span className="sub">{count('Active')} active · {count('Setup pending')} setup pending · {count('Archived')} archived</span></div>
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
            <span className="hint num" style={{ marginLeft: 'auto' }}>{rows.length} of {DEPARTMENTS.length} departments</span>
          </div>

          <div className="card">
            <table className="table">
              <thead><tr><th style={{ width: '26%' }}>Department</th><th>Department admin</th><th>Users</th><th>Supervisors</th><th>Processes</th><th>Status</th><th className="actions">Actions</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 32 }}>No departments match these filters.</td></tr>}
                {rows.map((d) => {
                  const people = d.users + d.supervisors
                  const deps = people + d.processes
                  const noAdmin = d.admin === '—'
                  return (
                    <tr key={d.id}>
                      <td><div className="stack" style={{ gap: 2 }}><span className="t-title">{d.name}</span><span className="hint">{d.desc}</span></div></td>
                      <td>
                        {noAdmin ? <span className="muted">Not assigned</span> : d.admin}
                      </td>
                      <td className="num">{d.users}</td>
                      <td className="num">{d.supervisors}</td>
                      <td className="num">{d.processes}</td>
                      <td>{deptTag(d.status)}</td>
                      <td className="actions">
                        <Dropdown width={240} trigger={({ toggle }) => <button className="btn ghost sm icon" onClick={toggle} aria-label={`Actions for ${d.name}`}><MoreHorizontal /></button>}>
                          <button onClick={() => setDlg({ kind: 'edit', d })}><PenLine />Edit name and description</button>
                          {d.status !== 'Archived' && <button onClick={() => setDlg({ kind: 'archive', d })}><Archive />Archive department</button>}
                          <button disabled={deps > 0} onClick={() => setDlg({ kind: 'delete', d })}><Trash2 />{deps > 0 ? 'Delete · has records' : 'Delete department'}</button>
                        </Dropdown>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="hint">Departments with people or process history can’t be deleted. Archive them instead so approved processes and audit records stay available.</p>
        </div>
      </div>

      {(dlg?.kind === 'create' || dlg?.kind === 'edit') && (
        <Modal title={dlg.kind === 'create' ? 'New department' : `Edit ${dlg.d.name}`} onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" onClick={() => { setDlg(null); toast(dlg.kind === 'create' ? 'Department created — invitation sent to its admin' : 'Department updated') }}>{dlg.kind === 'create' ? 'Create department' : 'Save changes'}</button></>}>
          <div className="field"><label>Name</label><input className="input" defaultValue={dlg.d?.name} placeholder="e.g. Office of Student Affairs" /></div>
          <div className="field"><label>Description</label><textarea className="textarea" defaultValue={dlg.d?.desc} placeholder="What this department is responsible for" /></div>
          {dlg.kind === 'create' && (
            <>
              <div className="divider" />
              <span className="label">Department admin</span>
              <AdminFields />
            </>
          )}
        </Modal>
      )}
      {dlg?.kind === 'admin' && (
        <Modal title={`${dlg.d.admin === '—' ? 'Assign' : 'Replace'} admin for ${dlg.d.name}`} onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" onClick={() => { setDlg(null); toast('Department admin updated — invitation sent') }}>Save</button></>}>
          {dlg.d.admin !== '—' && <p className="ink2 small">{dlg.d.admin} will lose admin access to this department.</p>}
          <AdminFields />
        </Modal>
      )}
      {dlg?.kind === 'archive' && (
        <Modal title={`Archive ${dlg.d.name}?`} sub="Archived departments can’t receive new people or assignments." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" disabled={dlg.d.users + dlg.d.supervisors > 0} onClick={() => { setDlg(null); toast('Department archived') }}><Archive />Archive</button></>}>
          {dlg.d.users + dlg.d.supervisors > 0
            ? <div className="notice warn"><Ban /><span><b>{dlg.d.users + dlg.d.supervisors} people are still active here.</b> Ask {dlg.d.admin} to reassign or deactivate them, and resolve pending reviews, before archiving.</span></div>
            : <p className="ink2">Its {dlg.d.processes} approved processes, versions and audit history are kept and stay viewable to people with access.</p>}
        </Modal>
      )}
      {dlg?.kind === 'delete' && (
        <Modal title={`Delete ${dlg.d.name}?`} sub="This department has no people, assignments or process records." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn danger solid" onClick={() => { setDlg(null); toast('Department deleted') }}><Trash2 />Delete permanently</button></>}>
          <p className="ink2">This can’t be undone.</p>
        </Modal>
      )}
    </>
  )
}

function AdminFields() {
  return (
    <>
      <div className="grid-2" style={{ gap: 12 }}>
        <div className="field"><label>Full name</label><input className="input" /></div>
        <div className="field"><label>Institutional email</label><input className="input" placeholder="name@udallas.edu" /></div>
      </div>
      <span className="hint row gap1" style={{ gap: 6 }}><ShieldCheck size={12} />Linked to their UD ADFS account. They’ll get an invitation email.</span>
    </>
  )
}
