// Shared pieces of the Super Admin institute screens (design prototype only — no backend):
// validation, the institute form, the ADFS panel and the edit form. Used by the Institutes list
// (create popup) and the institute page (InstituteDetail.jsx).
import { useState } from 'react'
import { Plus, Copy, Eye, EyeOff, KeyRound, PlugZap, Power, PowerOff, Check, AlertTriangle } from 'lucide-react'
import { GEO } from './store'
import { Tag, useToast } from '../../components/ui'

export const stTag = (s) => <Tag kind={s === 'Active' ? 'approved' : s === 'Suspended' ? 'danger' : 'draft'}>{s}</Tag>

export const EMPTY = { name: '', website: '', domain: '', address: '', country: '', state: '', city: '', zipcode: '', campuses: [], description: '' }
export const newTenant = () => `tnt_${Math.random().toString(16).slice(2, 10).padEnd(8, '0')}`
const RE = {
  website: /^(https?:\/\/)?([\da-z-]+\.)+[a-z]{2,}([/\w .-]*)*\/?$/i,
  domain: /^(?!\d+\.[a-z]{2,}$)([a-z0-9-]+\.)+[a-z]{2,}$/i,
  zipcode: /^[A-Za-z0-9 -]{3,12}$/,
}

export function validate(v, others) {
  const e = {}
  const name = v.name.trim()
  if (!name) e.name = 'Institute name is required'
  else if (name.length < 2 || name.length > 100) e.name = 'Name must be 2–100 characters'
  else if (others.some((o) => o.name.toLowerCase() === name.toLowerCase())) e.name = 'An institute with this name already exists'
  if (!v.website.trim()) e.website = 'Website is required'
  else if (!RE.website.test(v.website.trim())) e.website = 'Enter a valid website URL'
  if (!v.domain.trim()) e.domain = 'Email domain is required'
  else if (!RE.domain.test(v.domain.trim())) e.domain = 'Enter a valid domain, e.g. example.edu'
  else if (others.some((o) => o.domain.toLowerCase() === v.domain.trim().toLowerCase())) e.domain = 'This domain already belongs to another institute'
  const addr = v.address.trim()
  if (!addr) e.address = 'Address Line 1 is required'
  else if (addr.length < 5 || addr.length > 100) e.address = 'Address must be 5–100 characters'
  if (!v.country) e.country = 'Country is required'
  if (!v.zipcode.trim()) e.zipcode = 'Zipcode is required'
  else if (!RE.zipcode.test(v.zipcode.trim())) e.zipcode = '3–12 letters, numbers, spaces or hyphens'
  if (v.campuses.length === 0) e.campuses = 'Add at least one campus'
  return e
}

// ── ADFS (OIDC) ─────────────────────────────────────────────────────────────
// Same redirect URI for every institute (built from APP_BASE_URL on the backend).
export const REDIRECT_URI = 'https://api.processatlas.app/api/v1/auth/oidc/callback'
const DISCOVERY_RE = /^https:\/\/[a-z0-9.-]+(:\d+)?\/.*\.well-known\/openid-configuration$/i
const SSO_TAG = { 'Not configured': 'draft', Draft: 'returned', Active: 'approved', Disabled: 'danger' }
export const ssoTag = (st) => <Tag kind={SSO_TAG[st]}>{st}</Tag>

// requireSecret=false when a secret is already stored and the admin isn't replacing it
function validateSso({ ssoUrl, ssoClientId, ssoSecret }, { requireSecret = true } = {}) {
  const e = {}
  if (!ssoUrl.trim()) e.ssoUrl = 'Discovery URL is required'
  else if (!/^https:\/\//i.test(ssoUrl.trim())) e.ssoUrl = 'Must start with https://'
  else if (!DISCOVERY_RE.test(ssoUrl.trim())) e.ssoUrl = 'Should end with /.well-known/openid-configuration, e.g. https://sso.example.edu/adfs/.well-known/openid-configuration'
  if (!ssoClientId.trim()) e.ssoClientId = 'Client ID is required'
  if (requireSecret && !ssoSecret) e.ssoSecret = 'Client secret is required'
  return e
}

function SecretInput({ id, value, onChange, placeholder = 'Paste the client secret' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="row gap2">
      <input id={id} className="input mono" style={{ flex: 1 }} type={show ? 'text' : 'password'} autoComplete="new-password" spellCheck={false}
        placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="btn icon" aria-label={show ? 'Hide secret' : 'Show secret'} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button>
    </div>
  )
}

function RedirectUri() {
  const toast = useToast()
  return (
    <div className="field"><label>Redirect URI</label>
      <div className="row gap2"><input className="input mono" readOnly value={REDIRECT_URI} aria-label="Redirect URI" />
        <button type="button" className="btn icon" aria-label="Copy redirect URI" onClick={() => { navigator.clipboard?.writeText(REDIRECT_URI); toast('Redirect URI copied') }}><Copy /></button></div>
      <span className="hint">Same for every institute. Send it to the institute's IT team to register in their ADFS.</span>
    </div>
  )
}

export function SsoFields({ v, set, errors, secretSlot }) {
  const err = (k) => errors[k] && <span className="field-err" role="alert">{errors[k]}</span>
  return (
    <>
      <div className="field"><label htmlFor="s-url">ADFS discovery URL</label>
        <input id="s-url" className="input" placeholder="https://sso.example.edu/adfs/.well-known/openid-configuration" value={v.ssoUrl} onChange={(e) => set({ ssoUrl: e.target.value.trim() })} />
        {err('ssoUrl') || <span className="hint">From the institute's IT team.</span>}
      </div>
      <div className="field"><label htmlFor="s-cid">Client ID</label>
        <input id="s-cid" className="input mono" placeholder="e.g. 3f6c1d2a-…" value={v.ssoClientId} onChange={(e) => set({ ssoClientId: e.target.value.trim() })} />{err('ssoClientId')}
      </div>
      <div className="field"><label htmlFor="s-sec">Client secret</label>
        {secretSlot || <SecretInput id="s-sec" value={v.ssoSecret} onChange={(x) => set({ ssoSecret: x })} />}
        {err('ssoSecret') || <span className="hint">Encrypted when saved. It can be replaced but never shown again.</span>}
      </div>
      <RedirectUri />
    </>
  )
}

// Drawer section: status, edit, test, enable/disable. (Design simulation — no real network calls.)
export function AdfsPanel({ inst, onChange }) {
  const toast = useToast()
  const sso = inst.sso
  const status = sso?.status || 'Not configured'
  const [editing, setEditing] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [v, setV] = useState({ ssoUrl: sso?.discoveryUrl || '', ssoClientId: sso?.clientId || '', ssoSecret: '' })
  const [errors, setErrors] = useState({})
  const [testing, setTesting] = useState(false)
  const set = (patch) => setV((c) => ({ ...c, ...patch }))
  const today = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

  const save = () => {
    const needSecret = !sso || replacing
    const e = validateSso(v, { requireSecret: needSecret }); setErrors(e)
    if (Object.keys(e).length) return
    const changed = !sso || v.ssoUrl !== sso.discoveryUrl || v.ssoClientId !== sso.clientId || replacing
    onChange({ ...(sso || {}), discoveryUrl: v.ssoUrl, clientId: v.ssoClientId,
      secretSetAt: needSecret ? today().slice(0, 10) : sso.secretSetAt,
      ...(changed ? { status: 'Draft', lastTest: null } : {}) })
    setEditing(false); setReplacing(false); set({ ssoSecret: '' })
    toast(changed ? 'ADFS settings saved — test the connection to enable' : 'No changes')
  }
  const test = () => {
    setTesting(true)
    setTimeout(() => {
      const ok = DISCOVERY_RE.test(sso.discoveryUrl)
      onChange({ ...sso, lastTest: { ok, at: today(), error: ok ? null : 'Could not read the discovery document. Check the URL and that our servers can reach the ADFS server.' } })
      setTesting(false); toast(ok ? 'Connection test passed' : 'Connection test failed')
    }, 700)
  }

  return (
    <section className="stack gap2">
      <div className="row spread"><span className="eyebrow">ADFS sign-in</span>{ssoTag(status)}</div>

      {!sso && !editing && (
        <>
          <span className="hint">Not set up. People at this institute sign in with email and password. Add ADFS when the institute's IT team sends the discovery URL, client ID and client secret.</span>
          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setEditing(true)}><KeyRound />Set up ADFS</button>
          <RedirectUri />
        </>
      )}

      {sso && !editing && (
        <>
          <dl className="stack" style={{ gap: 10, margin: 0 }}>
            <div className="stack" style={{ gap: 2 }}><dt className="hint">Discovery URL</dt><dd className="mono small" style={{ margin: 0, wordBreak: 'break-all' }}>{sso.discoveryUrl}</dd></div>
            <div className="stack" style={{ gap: 2 }}><dt className="hint">Client ID</dt><dd className="mono small" style={{ margin: 0 }}>{sso.clientId}</dd></div>
            <div className="stack" style={{ gap: 2 }}><dt className="hint">Client secret</dt><dd className="small" style={{ margin: 0 }}><span className="mono">••••••••••••</span> <span className="hint">Secret is set · updated {sso.secretSetAt}</span></dd></div>
          </dl>
          {sso.lastTest
            ? <span className="small row gap1" style={{ color: sso.lastTest.ok ? 'var(--approved)' : 'var(--brick)', alignItems: 'flex-start' }}>{sso.lastTest.ok ? <Check size={14} /> : <AlertTriangle size={14} />}{sso.lastTest.ok ? `Last test passed · ${sso.lastTest.at}` : `Last test failed · ${sso.lastTest.at}. ${sso.lastTest.error}`}</span>
            : <span className="hint">Not tested yet. ADFS can be enabled after a successful test.</span>}
          {status === 'Active' && <span className="hint">The ADFS button is shown on the sign-in page. Email and password sign-in keeps working.</span>}
          <div className="row wrap gap2">
            <button className="btn sm" onClick={() => { setEditing(true); setErrors({}) }}>Edit</button>
            <button className="btn sm" disabled={testing} onClick={test}><PlugZap />{testing ? 'Testing…' : 'Test connection'}</button>
            {status !== 'Active' && <button className="btn sm primary" disabled={!sso.lastTest?.ok} title={sso.lastTest?.ok ? '' : 'Run a successful test first'} onClick={() => { onChange({ ...sso, status: 'Active' }); toast('ADFS enabled') }}><Power />Enable</button>}
            {status === 'Active' && <button className="btn sm ghost danger" onClick={() => { onChange({ ...sso, status: 'Disabled' }); toast('ADFS disabled — email and password sign-in still works') }}><PowerOff />Disable</button>}
          </div>
        </>
      )}

      {editing && (
        <>
          {status === 'Active' && <span className="hint" style={{ color: 'var(--returned)' }}>Changing these settings turns ADFS off until the connection is tested and enabled again.</span>}
          <SsoFields v={v} set={set} errors={errors}
            secretSlot={sso && !replacing
              ? <div className="row gap2"><input className="input mono" readOnly value="••••••••••••" aria-label="Client secret (hidden)" /><button type="button" className="btn sm" onClick={() => setReplacing(true)}>Replace secret</button></div>
              : null} />
          <div className="row gap2">
            <button className="btn sm primary" onClick={save}>Save ADFS settings</button>
            <button className="btn sm ghost" onClick={() => { setEditing(false); setReplacing(false); setErrors({}); setV({ ssoUrl: sso?.discoveryUrl || '', ssoClientId: sso?.clientId || '', ssoSecret: '' }) }}>Cancel</button>
          </div>
        </>
      )}
    </section>
  )
}

export function InstituteFields({ v, set, errors, tenant, compact }) {
  const grid = compact ? { className: 'stack', style: { gap: 16 } } : { className: 'grid-2', style: { gap: 16 } }
  const [campus, setCampus] = useState('')
  const [campusErr, setCampusErr] = useState('')
  const states = GEO[v.country] || []
  const err = (k) => errors[k] && <span className="field-err" role="alert">{errors[k]}</span>
  const addCampus = () => {
    const c = campus.trim()
    if (!c) return
    if (v.campuses.some((x) => x.toLowerCase() === c.toLowerCase())) { setCampusErr('Campus already added'); return }
    set({ campuses: [...v.campuses, c] }); setCampus(''); setCampusErr('')
  }
  return (
    <>
      <div {...grid}>
        <div className="field"><label htmlFor="i-name">Institute name</label><input id="i-name" className="input" placeholder="e.g. University of Dallas" value={v.name} maxLength={100} onChange={(e) => set({ name: e.target.value })} />{err('name')}</div>
        <div className="field"><label htmlFor="i-web">Website</label><input id="i-web" className="input" placeholder="https://example.edu" value={v.website} onChange={(e) => set({ website: e.target.value })} />{err('website')}</div>
        <div className="field"><label htmlFor="i-dom">Email domain</label><input id="i-dom" className="input" placeholder="example.edu" value={v.domain} onChange={(e) => set({ domain: e.target.value.replace(/\s/g, '').toLowerCase() })} />{err('domain') || <span className="hint">Used to resolve this institute at sign-in.</span>}</div>
        {tenant && <div className="field"><label>Tenant ID</label><div className="row gap2"><input className="input mono" readOnly value={tenant} /><button type="button" className="btn icon" aria-label="Copy tenant ID" onClick={() => navigator.clipboard?.writeText(tenant)}><Copy /></button></div><span className="hint">Generated and permanent.</span></div>}
      </div>

      <div className="field"><label htmlFor="i-addr">Address Line 1</label><input id="i-addr" className="input" placeholder="Street address" value={v.address} maxLength={100} onChange={(e) => set({ address: e.target.value })} />{err('address')}</div>

      <div {...grid}>
        <div className="field"><label htmlFor="i-country">Country</label>
          <select id="i-country" className="select" value={v.country} onChange={(e) => set({ country: e.target.value, state: '', city: '' })}>
            <option value="">Select country</option>
            {Object.keys(GEO).sort().map((c) => <option key={c}>{c}</option>)}
          </select>{err('country')}
        </div>
        <div className="field"><label htmlFor="i-state">State<span className="opt">Optional</span></label>
          <select id="i-state" className="select" value={v.state} disabled={!v.country} onChange={(e) => set({ state: e.target.value, city: '' })}>
            <option value="">{v.country ? 'Select state' : 'Select a country first'}</option>
            {states.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="i-city">City<span className="opt">Optional</span></label><input id="i-city" className="input" placeholder={v.state ? 'City' : 'Select a state first'} disabled={!v.state} value={v.city} onChange={(e) => set({ city: e.target.value })} /></div>
        <div className="field"><label htmlFor="i-zip">Zipcode</label><input id="i-zip" className="input" placeholder="Zipcode" maxLength={12} value={v.zipcode} onChange={(e) => set({ zipcode: e.target.value })} />{err('zipcode')}</div>
      </div>

      <div className="field"><label htmlFor="i-campus">Add campuses</label>
        <div className="row gap2">
          <input id="i-campus" className="input" style={{ flex: 1 }} placeholder="Enter campus name and press Enter" value={campus}
            onChange={(e) => { setCampus(e.target.value); setCampusErr('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCampus() } }} />
          <button type="button" className="btn" onClick={addCampus} disabled={!campus.trim()}><Plus />Add</button>
        </div>
        {campusErr ? <span className="field-err" role="alert">{campusErr}</span> : err('campuses')}
        {v.campuses.length > 0 && (
          <div className="row wrap gap1" aria-label="Added campuses">
            {v.campuses.map((c) => <span key={c} className="chip">{c}<button type="button" className="chip-x" aria-label={`Remove ${c}`} onClick={() => set({ campuses: v.campuses.filter((x) => x !== c) })}>×</button></span>)}
          </div>
        )}
      </div>

      <div className="field"><label htmlFor="i-desc">Description<span className="opt">Optional</span></label><textarea id="i-desc" className="textarea" rows={3} placeholder="Description" value={v.description} onChange={(e) => set({ description: e.target.value })} /></div>

    </>
  )
}

export function useInstituteForm(initial) {
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState({})
  const [tried, setTried] = useState(false)
  const set = (patch) => setV((cur) => ({ ...cur, ...patch }))
  return { v, set, errors, setErrors, tried, setTried }
}

export const toForm = (i) => ({ ...EMPTY, ...i, campuses: i.campuses || [] })
export const clean = (v) => ({ ...v, name: v.name.trim(), website: v.website.trim(), domain: v.domain.trim().toLowerCase(), address: v.address.trim(), city: v.city.trim(), zipcode: v.zipcode.trim(), description: v.description.trim() })

export function EditInstitute({ inst, list, onSave }) {
  const f = useInstituteForm(toForm(inst))
  const others = list.filter((x) => x.id !== inst.id)
  const set = (patch) => { f.set(patch); if (f.tried) f.setErrors(validate({ ...f.v, ...patch }, others)) }
  const dirty = JSON.stringify(clean(f.v)) !== JSON.stringify(clean(toForm(inst)))
  const save = () => {
    f.setTried(true)
    const e = validate(f.v, others); f.setErrors(e)
    if (!Object.keys(e).length) onSave(clean(f.v))
  }
  return (
    <>
      <InstituteFields v={f.v} set={set} errors={f.errors} />
      <div className="row gap2">
        <button className="btn primary" onClick={save} disabled={!dirty}>Save changes</button>
        <button className="btn ghost" onClick={() => { f.set(toForm(inst)); f.setErrors({}); f.setTried(false) }} disabled={!dirty}>Discard</button>
        {!dirty && <span className="hint">No unsaved changes</span>}
      </div>
    </>
  )
}
