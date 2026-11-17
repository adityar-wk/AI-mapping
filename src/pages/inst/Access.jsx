import { useState } from 'react'
import { Plus, User, Building2, Search, MoreHorizontal, Ban } from 'lucide-react'
import { Topbar } from '../../App'
import { GRANTS, DEPARTMENTS } from '../../data'
import { Modal, Dropdown, useToast } from '../../components/ui'

export default function Access() {
  const toast = useToast()
  const [grants, setGrants] = useState(GRANTS)
  const [dlg, setDlg] = useState(null)
  const [kind, setKind] = useState('User')
  const [f, setF] = useState('all')
  const [q, setQ] = useState('')
  const active = DEPARTMENTS.filter((d) => d.status !== 'Setup pending')
  const rows = grants.filter((g) => (f === 'all' || g.kind === f) && (!q || `${g.who} ${g.target}`.toLowerCase().includes(q.toLowerCase())))
  const n = (k) => grants.filter((g) => g.kind === k).length

  return (
    <>
      <Topbar title="Library access">
        <button className="btn primary" onClick={() => setDlg('grant')}><Plus />Grant access</button>
      </Topbar>
      <div className="page">
        <p className="lede muted">People always see their own department’s library. Grants here add access to another department’s approved processes — never drafts, never editing, never outside UD.</p>

        <div className="row spread wrap gap2">
          <div className="search" style={{ width: 340 }}><Search /><input className="input" placeholder="Search people, departments or libraries" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search grants" /></div>
          <div className="seg" aria-label="Grant level">
            {[['all', `All · ${grants.length}`], ['User', `Person · ${n('User')}`], ['Department', `Department · ${n('Department')}`]].map(([k, l]) => <button key={k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{l}</button>)}
          </div>
        </div>

        <div className="card">
          <table className="table">
            <thead><tr><th>Granted to</th><th>Library</th><th>Access</th><th>Granted by</th><th>Granted on</th><th className="actions">Actions</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 32 }}>No grants match.</td></tr>}
              {rows.map((g) => (
                <tr key={g.id}>
                  <td>
                    <span className="row gap2" data-tip={g.kind === 'User' ? 'Person' : 'Whole department'} style={{ width: 'fit-content' }}>
                      {g.kind === 'User' ? <User size={15} color="var(--ink-3)" /> : <Building2 size={15} color="var(--ink-3)" />}
                      <span className="t-title">{g.who}</span>
                    </span>
                  </td>
                  <td>{g.target}</td>
                  <td className="ink2">View only</td>
                  <td className="ink2">{g.by}</td>
                  <td className="ink2 num">{g.at}</td>
                  <td className="actions">
                    <Dropdown width={200} trigger={({ toggle }) => <button className="btn ghost sm icon" onClick={toggle} aria-label={`Actions for ${g.who}`}><MoreHorizontal /></button>}>
                      <button onClick={() => setDlg(g)} style={{ color: 'var(--brick)' }}><Ban style={{ color: 'var(--brick)' }} />Revoke access</button>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dlg === 'grant' && (
        <Modal title="Grant library access" sub="View-only access to approved processes in another UD department." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" onClick={() => { setDlg(null); toast('Access granted') }}>Grant access</button></>}>
          <div className="field"><label>Grant to</label>
            <div className="seg" style={{ alignSelf: 'flex-start' }}><button className={kind === 'User' ? 'on' : ''} onClick={() => setKind('User')}><User />A person</button><button className={kind === 'Department' ? 'on' : ''} onClick={() => setKind('Department')}><Building2 />A whole department</button></div>
          </div>
          {kind === 'User'
            ? <div className="field"><label>Person</label><input className="input" placeholder="Search UD people on the platform" /></div>
            : <div className="field"><label>Department</label><select className="select">{active.map((d) => <option key={d.id}>{d.name}</option>)}</select></div>}
          <div className="field"><label>Library</label><select className="select">{active.map((d) => <option key={d.id}>{d.name}</option>)}</select></div>
          <div className="field"><label>Access</label><select className="select" disabled><option>View only</option></select><span className="hint">Cross-department access is always view-only.</span></div>
        </Modal>
      )}
      {dlg && dlg !== 'grant' && (
        <Modal title="Revoke access?" sub={`${dlg.who} will no longer see the ${dlg.target} library.`} onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn danger solid" onClick={() => { setGrants((x) => x.filter((y) => y.id !== dlg.id)); setDlg(null); toast('Access revoked') }}>Revoke access</button></>}>
          <p className="ink2">This takes effect on their next action, including on screens they already have open.</p>
        </Modal>
      )}
    </>
  )
}
