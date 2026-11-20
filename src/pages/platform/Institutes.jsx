import { useEffect, useState } from 'react'
import { Plus, ChevronRight, X, Pause, Play, Archive, UserCog, UserMinus, Copy, Search, Phone } from 'lucide-react'
import { Topbar } from '../../App'
import { INSTITUTES } from '../../data'
import { Drawer, Modal, Tag, Avatar, useToast } from '../../components/ui'

const stTag = (s) => <Tag kind={s === 'Active' ? 'approved' : s === 'Suspended' ? 'danger' : 'draft'}>{s}</Tag>

export default function Institutes() {
  const toast = useToast()
  const [list, setList] = useState(INSTITUTES)
  const [open, setOpen] = useState(null)
  const [dlg, setDlg] = useState(null)
  const [q, setQ] = useState('')
  const [valid, setValid] = useState(false)
  const rows = list.filter((i) => !q || `${i.name} ${i.branch} ${i.domain} ${i.tenant} ${i.address?.city}`.toLowerCase().includes(q.toLowerCase()))
  const inst = list.find((i) => i.id === open)
  const setStatus = (id, status) => { setList((l) => l.map((x) => (x.id === id ? { ...x, status } : x))); setDlg(null); toast(`Institute ${status.toLowerCase()}`) }

  return (
    <>
      <Topbar title="Institutes">
        <button className="btn primary" onClick={() => setDlg({ kind: 'create' })}><Plus />New institute</button>
      </Topbar>
      <div className="page">
        <p className="lede muted">Each institute is an isolated tenant: its people, departments, files and processes are never visible to another.</p>
        <div className="row spread wrap gap2">
          <div className="search" style={{ width: 340 }}><Search /><input className="input" placeholder="Search by name, branch, city, domain or tenant ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search institutes" /></div>
          <span className="hint num">{rows.length} of {list.length} institutes</span>
        </div>
        <div className="card">
          <table className="table">
            <thead><tr><th>Institute</th><th>Tenant ID</th><th>Institute Admin</th><th className="right">Users</th><th className="right">Processes</th><th>Status</th><th className="actions" /></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 32 }}>No institutes match “{q}”.</td></tr>}
              {rows.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => setOpen(i.id)}>
                  <td><div className="stack" style={{ gap: 0 }}><span className="t-title">{i.name}</span><span className="hint">{[i.branch, i.address?.city && `${i.address.city}, ${i.address.state}`, i.domain].filter(Boolean).join(' · ')}</span></div></td>
                  <td className="mono ink2">{i.tenant}</td>
                  <td>{i.admin || <span style={{ color: 'var(--returned)' }}>Not assigned</span>}</td>
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

      {inst && (
        <Drawer onClose={() => setOpen(null)}>
          <div className="pane-head"><div className="stack" style={{ gap: 2 }}><h2>{inst.name}</h2><span className="mono muted">{inst.tenant}</span></div><button className="btn ghost icon sm" onClick={() => setOpen(null)} aria-label="Close"><X /></button></div>
          <div className="pane-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="row spread">{stTag(inst.status)}<span className="hint">Created {inst.created}</span></div>
            <InstituteFields key={inst.id} inst={inst} />
            <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Institute details saved')}>Save details</button>
            <div className="divider" />
            <section className="stack gap2">
              <span className="eyebrow">Institute Admin</span>
              {inst.admin ? (
                <div className="row gap2"><Avatar name={inst.admin} /><span className="grow">{inst.admin}</span>
                  <button className="btn sm" onClick={() => setDlg({ kind: 'admin', inst })}><UserCog />Change</button>
                  <button className="btn sm ghost danger" onClick={() => setDlg({ kind: 'removeAdmin', inst })}><UserMinus /></button>
                </div>
              ) : <button className="btn sm primary" style={{ alignSelf: 'flex-start' }} onClick={() => setDlg({ kind: 'admin', inst })}><UserCog />Assign Institute Admin</button>}
            </section>
            <div className="divider" />
            <section className="stack gap2">
              <span className="eyebrow">Lifecycle</span>
              {inst.status !== 'Active' && inst.status !== 'Archived' && <button className="btn" onClick={() => setStatus(inst.id, 'Active')}><Play />Activate</button>}
              {inst.status === 'Active' && <button className="btn" onClick={() => setDlg({ kind: 'suspend', inst })}><Pause />Suspend access</button>}
              {inst.status !== 'Archived' && <button className="btn" onClick={() => setDlg({ kind: 'archive', inst })}><Archive />Archive institute</button>}
              {inst.status === 'Archived' && <span className="hint">Archived — data retained, no one can sign in. Reactivation is a support request.</span>}
            </section>
          </div>
        </Drawer>
      )}

      {dlg?.kind === 'create' && (
        <Modal title="New institute" sub="Creates a new isolated tenant with its own ID." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" disabled={!valid} onClick={() => { setDlg(null); toast('Institute created — assign its admin next') }}>Create institute</button></>}>
          <InstituteFields create onValid={setValid} />
        </Modal>
      )}
      {dlg?.kind === 'admin' && (
        <Modal title={`${dlg.inst.admin ? 'Change' : 'Assign'} Institute Admin`} sub={dlg.inst.name} onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" onClick={() => { setDlg(null); toast('Institute Admin updated — invitation sent') }}>Save</button></>}>
          <div className="grid-2" style={{ gap: 12 }}><div className="field"><label>Full name</label><input className="input" /></div><div className="field"><label>Institutional email</label><input className="input" placeholder={`name@${dlg.inst.domain}`} /></div></div>
          {dlg.inst.admin && <span className="hint">{dlg.inst.admin} loses Institute Admin access when you save.</span>}
        </Modal>
      )}
      {dlg?.kind === 'removeAdmin' && (
        <Modal title={`Remove ${dlg.inst.admin}?`} sub="The institute will have no Institute Admin until you assign one." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn danger solid" onClick={() => { setDlg(null); toast('Institute Admin removed') }}>Remove</button></>}><span /></Modal>
      )}
      {dlg?.kind === 'suspend' && (
        <Modal title={`Suspend ${dlg.inst.name}?`} sub={`All ${dlg.inst.users} people lose access immediately and active sessions end. Data is kept.`} onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn danger solid" onClick={() => setStatus(dlg.inst.id, 'Suspended')}><Pause />Suspend institute</button></>}>
          <div className="field"><label>Reason</label><input className="input" /></div>
        </Modal>
      )}
      {dlg?.kind === 'archive' && (
        <Modal title={`Archive ${dlg.inst.name}?`} sub="Nothing is deleted. The institute becomes read-only to support and no one can sign in." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" onClick={() => setStatus(dlg.inst.id, 'Archived')}><Archive />Archive</button></>}>
          <div className="field"><label>Type the tenant ID to confirm</label><input className="input mono" placeholder={dlg.inst.tenant} /></div>
        </Modal>
      )}
    </>
  )
}

const TYPES = ['University', 'College', 'Community college', 'Seminary', 'School', 'Other']
const EMPTY = { name: '', branch: '', type: 'University', website: '', email: '', phones: [{ label: 'Main', number: '' }], address: { line1: '', line2: '', city: '', state: '', postal: '', country: 'United States' }, timezone: 'America/Chicago', domain: '' }

/* Institute details, used when creating an institute and in its settings drawer */
function InstituteFields({ inst, create, onValid }) {
  const [f, setF] = useState(() => (inst ? { ...EMPTY, ...inst, phones: inst.phones?.length ? inst.phones : EMPTY.phones } : EMPTY))
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  // the parent's Create button only enables once the required fields are filled
  useEffect(() => { onValid?.(!!f.name.trim() && !!f.domain.trim()) }, [f.name, f.domain])
  const setAddr = (k, v) => set('address', { ...f.address, [k]: v })
  const setPhone = (i, k, v) => set('phones', f.phones.map((p, j) => (j === i ? { ...p, [k]: v } : p)))
  const domain = f.domain || 'example.edu'

  return (
    <>
      <section className="stack gap2">
        <span className="eyebrow">Institute</span>
        <div className="field"><label>Institute name</label><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. University of Dallas" /></div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field"><label>Branch or campus <span className="hint">(optional)</span></label><input className="input" value={f.branch} onChange={(e) => set('branch', e.target.value)} placeholder="e.g. Irving campus" /></div>
          <div className="field"><label>Type</label><select className="select" value={f.type} onChange={(e) => set('type', e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field"><label>Website</label><input className="input" value={f.website} onChange={(e) => set('website', e.target.value)} placeholder="https://example.edu" /></div>
          <div className="field"><label>General contact email</label><input className="input" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="info@example.edu" /></div>
        </div>
      </section>

      <section className="stack gap2">
        <span className="eyebrow">Phone numbers</span>
        {f.phones.map((p, i) => (
          <div key={i} className="row gap2">
            <input className="input" style={{ width: 150, flex: 'none' }} value={p.label} onChange={(e) => setPhone(i, 'label', e.target.value)} placeholder="Label" aria-label="Phone label" />
            <input className="input grow" value={p.number} onChange={(e) => setPhone(i, 'number', e.target.value)} placeholder="+1 555-555-0100" aria-label="Phone number" />
            {f.phones.length > 1 && <button className="btn ghost icon sm" aria-label="Remove phone number" onClick={() => set('phones', f.phones.filter((_, j) => j !== i))}><X /></button>}
          </div>
        ))}
        <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => set('phones', [...f.phones, { label: '', number: '' }])}><Phone />Add phone number</button>
      </section>

      <section className="stack gap2">
        <span className="eyebrow">Address</span>
        <div className="field"><label>Street address</label><input className="input" value={f.address.line1} onChange={(e) => setAddr('line1', e.target.value)} /></div>
        <div className="field"><label>Address line 2 <span className="hint">(optional)</span></label><input className="input" value={f.address.line2} onChange={(e) => setAddr('line2', e.target.value)} placeholder="Suite, building, floor" /></div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field"><label>City</label><input className="input" value={f.address.city} onChange={(e) => setAddr('city', e.target.value)} /></div>
          <div className="field"><label>State or region</label><input className="input" value={f.address.state} onChange={(e) => setAddr('state', e.target.value)} /></div>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field"><label>Postal code</label><input className="input" value={f.address.postal} onChange={(e) => setAddr('postal', e.target.value)} /></div>
          <div className="field"><label>Country</label><input className="input" value={f.address.country} onChange={(e) => setAddr('country', e.target.value)} /></div>
        </div>
        <div className="field"><label>Time zone</label>
          <select className="select" value={f.timezone} onChange={(e) => set('timezone', e.target.value)}>
            {['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata'].map((t) => <option key={t}>{t}</option>)}
          </select>
          <span className="hint">Used for timestamps in version history, notifications and exports.</span>
        </div>
      </section>

      <section className="stack gap2">
        <span className="eyebrow">Sign-in</span>
        <div className="field"><label>Email domain</label><input className="input" value={f.domain} onChange={(e) => set('domain', e.target.value)} placeholder="example.edu" /><span className="hint">Used to resolve this institute at sign-in.</span></div>
        {create && <div className="field"><label>Tenant ID</label><div className="row gap2"><input className="input mono" readOnly value="tnt_5e2c8a17" /><button className="btn icon" aria-label="Copy"><Copy /></button></div><span className="hint">Generated and permanent.</span></div>}
        <div className="field"><label>ADFS federation metadata URL</label><input className="input" defaultValue={inst ? `https://adfs.${inst.domain}/FederationMetadata/2007-06/FederationMetadata.xml` : ''} placeholder={`https://adfs.${domain}/FederationMetadata/…`} /></div>
      </section>
    </>
  )
}
