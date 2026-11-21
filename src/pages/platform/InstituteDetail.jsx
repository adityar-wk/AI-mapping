import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pause, Play, Archive, Copy, Users, FileStack, HardDrive, KeyRound, UserPlus, CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react'
import { Topbar } from '../../App'
import { usePlatform, platform, adminName } from './store'
import { Modal, useToast } from '../../components/ui'
import { statusTag } from '../../components/AdminForm'
import { stTag, ssoTag, AdfsPanel, EditInstitute } from './instituteParts'

// Super Admin → one institute, on its own page (not a side panel): every section has room,
// its own URL (/platform/institutes/:id/:tab) and its own Save. Design prototype only.

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'details', label: 'Details' },
  { key: 'adfs', label: 'ADFS sign-in' },
  { key: 'admins', label: 'Institute admins' },
  { key: 'usage', label: 'Usage' },
]

const ADFS_STEPS = [
  'Copy the redirect URI (left) and send it to the institute’s IT team. They register Process Atlas in their ADFS.',
  'They send back the discovery URL, client ID and client secret. Enter them here and save.',
  'Test the connection. Process Atlas reads their ADFS settings and checks they’re valid.',
  'Enable. The “Sign in with ADFS” button appears for this institute; email and password keep working.',
]

export default function InstituteDetail() {
  const { id, tab = 'overview' } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { institutes, admins } = usePlatform()
  const [dlg, setDlg] = useState(null)
  const inst = institutes.find((i) => i.id === id)

  if (!inst) {
    return (
      <>
        <Topbar crumbs={[{ label: 'Institutes', to: '/platform' }, { label: 'Not found' }]} />
        <div className="page"><div className="card card-pad stack gap2">
          <h2>Institute not found</h2>
          <span className="hint">The link may be wrong, or the institute no longer exists.</span>
          <Link to="/platform">Back to institutes</Link>
        </div></div>
      </>
    )
  }

  const active = TABS.some((t) => t.key === tab) ? tab : 'overview'
  const go = (t) => nav(`/platform/institutes/${inst.id}${t === 'overview' ? '' : `/${t}`}`)
  const update = (patch) => platform.setInstitutes((l) => l.map((x) => (x.id === inst.id ? { ...x, ...patch } : x)))
  const instAdmins = admins.filter((a) => a.instituteId === inst.id && a.status !== 'Deactivated')
  const setStatus = (status) => { update({ status }); setDlg(null); toast(`Institute ${status.toLowerCase()}`) }

  return (
    <>
      <Topbar crumbs={[{ label: 'Institutes', to: '/platform' }, { label: inst.name }]}>
        {inst.status === 'Suspended' && <button className="btn" onClick={() => setStatus('Active')}><Play />Activate</button>}
        {inst.status === 'Active' && <button className="btn" onClick={() => setDlg('suspend')}><Pause />Suspend</button>}
        {inst.status !== 'Archived' && <button className="btn ghost" onClick={() => setDlg('archive')}><Archive />Archive</button>}
      </Topbar>

      <div className="page">
        <div className="stack" style={{ gap: 8 }}>
          <h1>{inst.name}</h1>
          <div className="row wrap gap2 hint">
            {stTag(inst.status)}
            <span className="row gap1"><span className="mono">{inst.tenant}</span>
              <button className="btn ghost icon sm" aria-label="Copy tenant ID" onClick={() => { navigator.clipboard?.writeText(inst.tenant); toast('Tenant ID copied') }}><Copy /></button></span>
            <span>· {inst.domain}</span><span>· created {inst.created}</span>
          </div>
          {inst.status === 'Archived' && <div className="notice"><Archive /><span>Archived: data is kept and no one can sign in. Reactivation is a support request.</span></div>}
          {inst.status === 'Suspended' && <div className="notice warn"><Pause /><span>Suspended: nobody at this institute can sign in. Data is untouched.</span></div>}
        </div>

        <div className="tabs" role="tablist" aria-label="Institute sections">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={active === t.key} className={active === t.key ? 'on' : ''} onClick={() => go(t.key)}>
              {t.label}
              {t.key === 'admins' && <span className="hint num">{instAdmins.length}</span>}
            </button>
          ))}
        </div>

        {active === 'overview' && <Overview inst={inst} instAdmins={instAdmins} go={go} />}

        {active === 'details' && (
          <div className="card card-pad stack gap4" style={{ maxWidth: 880 }}>
            <div className="stack" style={{ gap: 2 }}><h2>Institute details</h2><span className="hint">Used on sign-in and shown to the institute’s people. The tenant ID never changes.</span></div>
            <EditInstitute key={inst.id} inst={inst} list={institutes} onSave={(patch) => { update(patch); toast('Institute details saved') }} />
          </div>
        )}

        {active === 'adfs' && (
          <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
            <div className="card card-pad"><AdfsPanel key={inst.id} inst={inst} onChange={(sso) => update({ sso })} /></div>
            <aside className="card card-pad stack gap3">
              <h3 style={{ fontSize: 15 }}>How ADFS sign-in is set up</h3>
              <ol className="stack gap2" style={{ margin: 0, paddingLeft: 18 }}>
                {ADFS_STEPS.map((s) => <li key={s} className="small ink2">{s}</li>)}
              </ol>
            </aside>
          </div>
        )}

        {active === 'admins' && <Admins inst={inst} instAdmins={instAdmins} />}
        {active === 'usage' && <Usage inst={inst} />}
      </div>

      {dlg === 'suspend' && <SuspendDialog inst={inst} onClose={() => setDlg(null)} onConfirm={() => setStatus('Suspended')} />}
      {dlg === 'archive' && <ArchiveDialog inst={inst} onClose={() => setDlg(null)} onConfirm={() => setStatus('Archived')} />}
    </>
  )
}

function Overview({ inst, instAdmins, go }) {
  const sso = inst.sso?.status || 'Not configured'
  const steps = [
    { done: true, label: 'Institute details', hint: 'Name, domain, address and campuses are saved.', tab: 'details', action: 'Review' },
    { done: instAdmins.length > 0, label: 'Institute Admin', hint: instAdmins.length ? instAdmins.map(adminName).join(', ') : 'Nobody can manage departments until an admin is added.', tab: 'admins', action: instAdmins.length ? 'View' : 'Add admin' },
    { done: sso === 'Active', label: 'ADFS sign-in (optional)', hint: sso === 'Active' ? 'Enabled. People can also use email and password.' : sso === 'Not configured' ? 'Not set up yet. People sign in with email and password.' : `${sso}: test the connection, then enable.`, tab: 'adfs', action: sso === 'Active' ? 'View' : 'Set up' },
  ]
  return (
    <div className="stack gap5">
      <div className="ledger">
        <div><span className="eyebrow">Users</span><span className="big">{inst.users}</span><span className="sub"><Users size={12} /> across all departments</span></div>
        <div><span className="eyebrow">Processes</span><span className="big">{inst.processes}</span><span className="sub"><FileStack size={12} /> in every state</span></div>
        <div><span className="eyebrow">Storage</span><span className="big">{inst.storage} GB</span><span className="sub"><HardDrive size={12} /> of {inst.storageCap} GB</span></div>
        <div><span className="eyebrow">ADFS sign-in</span><span className="big" style={{ fontSize: 20, marginTop: 10 }}>{ssoTag(sso)}</span><span className="sub"><KeyRound size={12} /> email + password always on</span></div>
      </div>
      <div className="card card-pad stack gap3" style={{ maxWidth: 880 }}>
        <h2 style={{ fontSize: 16 }}>Setup</h2>
        {steps.map((s) => (
          <div key={s.label} className="row spread gap3" style={{ alignItems: 'flex-start' }}>
            <span className="row gap2" style={{ alignItems: 'flex-start' }}>
              {s.done ? <CheckCircle2 size={18} color="var(--approved)" /> : <Circle size={18} color="var(--ink-4)" />}
              <span className="stack" style={{ gap: 2 }}><b>{s.label}</b><span className="hint">{s.hint}</span></span>
            </span>
            <button className="btn sm" onClick={() => go(s.tab)}>{s.action}<ArrowRight /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Admins({ inst, instAdmins }) {
  const addLink = `/platform/users?new=${inst.id}`
  return (
    <div className="stack gap3">
      <div className="row spread wrap gap2">
        <span className="hint">Institute Admins manage this institute’s departments and Department Admins. They’re created in User management.</span>
        {inst.status === 'Active' && <Link className="btn primary" to={addLink}><UserPlus />Add Institute Admin</Link>}
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Added</th></tr></thead>
          <tbody>
            {instAdmins.length === 0 && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 32 }}>No Institute Admin yet.</td></tr>}
            {instAdmins.map((a) => (
              <tr key={a.id}><td className="t-title">{adminName(a)}</td><td className="ink2">{a.email}</td><td>{statusTag(a.status)}</td><td className="hint">{a.created || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Usage({ inst }) {
  const pct = Math.min(100, Math.round((inst.storage / inst.storageCap) * 100))
  return (
    <div className="stack gap4" style={{ maxWidth: 880 }}>
      <div className="ledger" style={{ '--cols': 3 }}>
        <div><span className="eyebrow">AI tokens (this month)</span><span className="big">{inst.ai.toLocaleString()}</span><span className="sub"><Sparkles size={12} /> tracked, never limited</span></div>
        <div><span className="eyebrow">Processes</span><span className="big">{inst.processes}</span><span className="sub">all states</span></div>
        <div><span className="eyebrow">Users</span><span className="big">{inst.users}</span><span className="sub">all roles</span></div>
      </div>
      <div className="card card-pad stack gap2">
        <div className="row spread"><b>Storage</b><span className="hint num">{inst.storage} GB of {inst.storageCap} GB · {pct}%</span></div>
        <div className="stackbar" role="img" aria-label={`Storage ${pct}% used`}><span style={{ width: `${pct}%`, background: 'var(--navy)' }} /></div>
      </div>
      <Link className="hint" to="/platform/usage">Compare all institutes in Usage by institute</Link>
    </div>
  )
}

function SuspendDialog({ inst, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  return (
    <Modal title={`Suspend ${inst.name}?`} sub={`All ${inst.users} people lose access immediately and active sessions end. Data is kept.`} onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn danger solid" disabled={!reason.trim()} onClick={onConfirm}><Pause />Suspend institute</button></>}>
      <div className="field"><label htmlFor="sus-reason">Reason</label><input id="sus-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Contract paused" /><span className="hint">Saved in the audit log.</span></div>
    </Modal>
  )
}

function ArchiveDialog({ inst, onClose, onConfirm }) {
  const [typed, setTyped] = useState('')
  return (
    <Modal title={`Archive ${inst.name}?`} sub="Nothing is deleted. The institute becomes read-only to support and no one can sign in." onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={typed !== inst.tenant} onClick={onConfirm}><Archive />Archive</button></>}>
      <div className="field"><label htmlFor="arch-confirm">Type the tenant ID <span className="mono">{inst.tenant}</span> to confirm</label><input id="arch-confirm" className="input mono" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={inst.tenant} /></div>
    </Modal>
  )
}
