import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { X, Pencil, Mail, Search, Check, ChevronDown } from 'lucide-react'
import { Drawer, Modal, Tag, Avatar, useToast } from './ui'

// Shared "admin user" form, validation and profile drawer. Used by:
//   Super Admin → User management (Institute Admins; scope = institute)
//   Institute Admin → Department admins (Department Admins; scope = department)
// Creating an admin is its own action and API: app_user + role_assignment + invitation.
// It is never bundled into creating an institute or a department.
//
// A `scope` describes what the admin is attached to:
//   { key: 'instituteId' | 'departmentId', label, role, options: [{ id, name, disabled, note }],
//     domainOf: (id) => email domain for that option, pickHint, lockHint,
//     fixed?: true            → show the scope as read-only text (e.g. the Department Admin's own department)
//     extraValidate?: (v) => errors for page-specific fields (role, supervisor, team)
//     extraRows?: (person) => [[label, value]] shown in the profile drawer
//     dupMessage?: string     → message when the email already exists
//     noAddress?: true        → contact-only form: no address/country/state/city/zipcode (Institute Admin and Dept Admin personas)
//     showRole?: true         → show the fixed role (scope.role) as read-only text
//     contactFirst?: true     → email + contact number come right after the name, before role/department
//     searchableCode?: true   → country code is a searchable picker instead of a short select }

export const adminName = (a) => `${a.firstName}${a.lastName ? ` ${a.lastName}` : ''}`
export const statusTag = (s) => <Tag kind={s === 'Active' ? 'approved' : s === 'Invited' ? 'review' : 'draft'}>{s}</Tag>

// Country → states. City is free text. (Design data only; the real app uses a full country/state/city list.)
export const GEO = {
  'United States': ['Arizona', 'California', 'Florida', 'Illinois', 'Massachusetts', 'New York', 'Texas', 'Washington'],
  India: ['Delhi', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'West Bengal'],
  'United Kingdom': ['England', 'Northern Ireland', 'Scotland', 'Wales'],
  Canada: ['Alberta', 'British Columbia', 'Ontario', 'Quebec'],
  Australia: ['New South Wales', 'Queensland', 'Victoria', 'Western Australia'],
  'United Arab Emirates': ['Abu Dhabi', 'Dubai', 'Sharjah'],
}

// Searchable dial-code list. Only the dial code is stored (phone_country_code); the ISO code is kept
// in the form so +1 US and +1 CA show correctly. (Design data; the real app uses the full ITU list.)
export const DIAL_CODES = [
  ['Argentina', 'AR', '+54'], ['Australia', 'AU', '+61'], ['Austria', 'AT', '+43'], ['Bangladesh', 'BD', '+880'],
  ['Belgium', 'BE', '+32'], ['Brazil', 'BR', '+55'], ['Canada', 'CA', '+1'], ['Chile', 'CL', '+56'], ['China', 'CN', '+86'],
  ['Colombia', 'CO', '+57'], ['Denmark', 'DK', '+45'], ['Egypt', 'EG', '+20'], ['Finland', 'FI', '+358'], ['France', 'FR', '+33'],
  ['Germany', 'DE', '+49'], ['Ghana', 'GH', '+233'], ['Greece', 'GR', '+30'], ['Hong Kong', 'HK', '+852'], ['India', 'IN', '+91'],
  ['Indonesia', 'ID', '+62'], ['Ireland', 'IE', '+353'], ['Israel', 'IL', '+972'], ['Italy', 'IT', '+39'], ['Japan', 'JP', '+81'],
  ['Kenya', 'KE', '+254'], ['Kuwait', 'KW', '+965'], ['Malaysia', 'MY', '+60'], ['Mexico', 'MX', '+52'], ['Nepal', 'NP', '+977'],
  ['Netherlands', 'NL', '+31'], ['New Zealand', 'NZ', '+64'], ['Nigeria', 'NG', '+234'], ['Norway', 'NO', '+47'], ['Oman', 'OM', '+968'],
  ['Pakistan', 'PK', '+92'], ['Peru', 'PE', '+51'], ['Philippines', 'PH', '+63'], ['Poland', 'PL', '+48'], ['Portugal', 'PT', '+351'],
  ['Qatar', 'QA', '+974'], ['Saudi Arabia', 'SA', '+966'], ['Singapore', 'SG', '+65'], ['South Africa', 'ZA', '+27'], ['South Korea', 'KR', '+82'],
  ['Spain', 'ES', '+34'], ['Sri Lanka', 'LK', '+94'], ['Sweden', 'SE', '+46'], ['Switzerland', 'CH', '+41'], ['Thailand', 'TH', '+66'],
  ['Turkey', 'TR', '+90'], ['United Arab Emirates', 'AE', '+971'], ['United Kingdom', 'GB', '+44'], ['United States', 'US', '+1'], ['Vietnam', 'VN', '+84'],
].map(([name, iso, dial]) => ({ name, iso, dial }))

/** Searchable country-code combobox. The list is position: fixed so the scrolling dialog can't clip it. */
function CountryCodePicker({ dial, iso, onChange }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const [pos, setPos] = useState(null)
  const btn = useRef(null)
  const pop = useRef(null)
  // +1 is shared by US and CA; with no ISO saved, default to US.
  const sel = DIAL_CODES.find((c) => c.iso === iso && c.dial === dial) || DIAL_CODES.find((c) => c.dial === dial && (dial !== '+1' || c.iso === 'US')) || DIAL_CODES.find((c) => c.iso === 'US')
  const term = q.trim().toLowerCase().replace(/^\+/, '')
  const list = DIAL_CODES.filter((c) => !term || c.name.toLowerCase().includes(term) || c.iso.toLowerCase() === term || c.dial.slice(1).startsWith(term))

  useLayoutEffect(() => {
    if (!open) return
    const r = btn.current.getBoundingClientRect()
    const h = 300
    const below = window.innerHeight - r.bottom > h + 8
    setPos({ left: r.left, width: Math.max(280, r.width), ...(below ? { top: r.bottom + 4 } : { bottom: window.innerHeight - r.top + 4 }) })
  }, [open])
  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!pop.current?.contains(e.target) && !btn.current.contains(e.target)) setOpen(false) }
    const away = (e) => { if (!pop.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    window.addEventListener('resize', away)
    document.addEventListener('scroll', away, true)
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('resize', away); document.removeEventListener('scroll', away, true) }
  }, [open])
  useEffect(() => { pop.current?.querySelector('.cc-opt.hi')?.scrollIntoView({ block: 'nearest' }) }, [hi])

  const pick = (c) => { onChange(c); setOpen(false); setQ(''); btn.current.focus() }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((i) => Math.min(i + 1, list.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (list[hi]) pick(list[hi]) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); btn.current.focus() }
  }
  return (
    <>
      <button ref={btn} type="button" className="select cc-btn" aria-label={`Country code ${sel.name} ${sel.dial}`} aria-haspopup="listbox" aria-expanded={open}
        onClick={() => { setOpen((o) => !o); setHi(Math.max(0, list.indexOf(sel))) }}>
        <span className="mono-ish">{sel.iso}</span> {sel.dial}
      </button>
      {open && pos && (
        <div ref={pop} className="cc-pop" style={{ position: 'fixed', ...pos }}>
          <div className="search"><Search /><input className="input" autoFocus placeholder="Search country or code" aria-label="Search country or code"
            value={q} onChange={(e) => { setQ(e.target.value); setHi(0) }} onKeyDown={onKey} /></div>
          <ul className="cc-list" role="listbox" aria-label="Country codes">
            {list.map((c, n) => (
              <li key={c.iso} role="option" aria-selected={c === sel} className={`cc-opt${n === hi ? ' hi' : ''}`}
                onMouseEnter={() => setHi(n)} onMouseDown={(e) => { e.preventDefault(); pick(c) }}>
                <span className="cc-name">{c === sel ? <Check size={14} /> : <span style={{ width: 14 }} />}{c.name} <span className="hint">{c.iso}</span></span>
                <span className="num ink2">{c.dial}</span>
              </li>
            ))}
            {list.length === 0 && <li className="hint" style={{ padding: '8px 10px' }}>No country matches “{q}”.</li>}
          </ul>
        </div>
      )}
    </>
  )
}

export const COUNTRY_CODES = [
  { code: '+1', label: '+1 US / CA' },
  { code: '+44', label: '+44 UK' },
  { code: '+61', label: '+61 AU' },
  { code: '+91', label: '+91 IN' },
  { code: '+971', label: '+971 AE' },
]

const BASE = { firstName: '', lastName: '', email: '', countryCode: '+1', phone: '', address: '', country: '', state: '', city: '', zipcode: '' }
export const emptyAdmin = (scope, preset = '') => ({ ...BASE, [scope.key]: preset })

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
const ZIP_RE = /^[A-Za-z0-9 -]{3,12}$/

function validate(v, { scope, people, selfId }) {
  const e = {}
  const first = v.firstName.trim()
  if (!first) e.firstName = 'First name is required'
  else if (first.length < 2) e.firstName = 'First name must be at least 2 characters'
  else if (/\d/.test(first)) e.firstName = 'First name can’t contain numbers'
  if (/\d/.test(v.lastName)) e.lastName = 'Last name can’t contain numbers'
  const opt = scope.options.find((o) => o.id === v[scope.key])
  if (!opt) e[scope.key] = `Select ${scope.label.toLowerCase() === 'institute' ? 'an' : 'a'} ${scope.label.toLowerCase()}`
  const domain = opt && scope.domainOf(opt.id)
  const email = v.email.trim().toLowerCase()
  if (!email) e.email = 'Email is required'
  else if (!EMAIL_RE.test(email)) e.email = 'Enter a valid email address'
  else if (domain && email.split('@')[1] !== domain.toLowerCase()) e.email = `Email must use the institute’s domain: @${domain}`
  else if (people.some((a) => a.id !== selfId && a.email.toLowerCase() === email)) e.email = scope.dupMessage || 'A user with this email already exists'
  if (!v.phone.trim()) e.phone = 'Contact number is required'
  else if (!/^\d{7,15}$/.test(v.phone.trim())) e.phone = 'Enter 7–15 digits'
  const addr = v.address.trim()
  if (scope.noAddress) { /* address not collected */ } else if (!addr) e.address = 'Address Line 1 is required'
  else if (addr.length < 5 || addr.length > 100) e.address = 'Address must be 5–100 characters'
  if (scope.noAddress) { /* address not collected */ } else if (!v.zipcode.trim()) e.zipcode = 'Zipcode is required'
  else if (!ZIP_RE.test(v.zipcode.trim())) e.zipcode = '3–12 letters, numbers, spaces or hyphens'
  if (scope.extraValidate) Object.assign(e, scope.extraValidate(v))
  return e
}

export const clean = (v) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' ? x.trim() : x]))

export function useAdminForm(initial, ctx) {
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState({})
  const [tried, setTried] = useState(false)
  const set = (patch) => setV((cur) => { const next = { ...cur, ...patch }; if (tried) setErrors(validate(next, ctx)); return next })
  const check = () => { setTried(true); const e = validate(v, ctx); setErrors(e); return Object.keys(e).length === 0 }
  return { v, set, errors, check, reset: () => { setV(initial); setErrors({}); setTried(false) } }
}

export function AdminFields({ v, set, errors, scope, lockScope, lockEmail, extra }) {
  const err = (k) => errors[k] && <span className="field-err" role="alert">{errors[k]}</span>
  const domain = scope.domainOf(v[scope.key] || '')
  const states = GEO[v.country] || []
  const contactBlock = (
    <>
      <div className="grid-2" style={{ gap: 16 }}>
        <div className="field"><label htmlFor="u-email">Email</label>
          <input id="u-email" className="input" type="email" placeholder={domain ? `name@${domain}` : 'name@institute.edu'} value={v.email} disabled={lockEmail}
            onChange={(e) => set({ email: e.target.value.replace(/\s/g, '').toLowerCase() })} />
          {err('email') || <span className="hint">{lockEmail ? 'Fixed after the account is activated.' : domain ? `Must end with @${domain}` : `Select ${scope.label.toLowerCase() === 'institute' ? 'an' : 'a'} ${scope.label.toLowerCase()} first to see the email domain.`}</span>}
        </div>
        <div className="field"><label htmlFor="u-phone">Contact number</label>
          <div className="row gap2">
            {scope.searchableCode
              ? <CountryCodePicker dial={v.countryCode} iso={v.countryIso} onChange={(c) => set({ countryCode: c.dial, countryIso: c.iso })} />
              : (
                <select className="select" style={{ width: 128 }} aria-label="Country code" value={v.countryCode} onChange={(e) => set({ countryCode: e.target.value })}>
                  {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              )}
            <input id="u-phone" className="input" style={{ flex: 1 }} inputMode="numeric" placeholder="98765 43210" value={v.phone} maxLength={15} onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '') })} />
          </div>
          {err('phone')}
        </div>
      </div>
    </>
  )
  return (
    <>
      <div className="grid-2" style={{ gap: 16 }}>
        <div className="field"><label htmlFor="u-first">First name</label><input id="u-first" className="input" placeholder="First name" value={v.firstName} onChange={(e) => set({ firstName: e.target.value })} />{err('firstName')}</div>
        <div className="field"><label htmlFor="u-last">Last name<span className="opt">Optional</span></label><input id="u-last" className="input" placeholder="Last name" value={v.lastName} onChange={(e) => set({ lastName: e.target.value })} />{err('lastName')}</div>
      </div>

      {scope.contactFirst && contactBlock}

      {scope.showRole && <div className="field"><span className="label">Role</span><span>{scope.role}</span></div>}

      {scope.fixed ? (
        <div className="field"><span className="label">{scope.label}</span><span>{scope.options.find((o) => o.id === v[scope.key])?.name}</span>{scope.pickHint && <span className="hint">{scope.pickHint}</span>}</div>
      ) : (
      <div className="field"><label htmlFor="u-scope">{scope.label}</label>
        <select id="u-scope" className="select" value={v[scope.key]} disabled={lockScope} onChange={(e) => set({ [scope.key]: e.target.value })}>
          <option value="">Select {scope.label.toLowerCase()}</option>
          {scope.options.map((o) => <option key={o.id} value={o.id} disabled={o.disabled}>{o.name}{o.note ? ` (${o.note})` : ''}</option>)}
        </select>
        {err(scope.key) || <span className="hint">{lockScope ? scope.lockHint : scope.pickHint}</span>}
      </div>
      )}

      {extra && extra({ v, set, err })}

      {!scope.contactFirst && contactBlock}

      {!scope.noAddress && (<>
      <div className="field"><label htmlFor="u-addr">Address Line 1</label><input id="u-addr" className="input" placeholder="Street address" maxLength={100} value={v.address} onChange={(e) => set({ address: e.target.value })} />{err('address')}</div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="field"><label htmlFor="u-country">Country<span className="opt">Optional</span></label>
          <select id="u-country" className="select" value={v.country} onChange={(e) => set({ country: e.target.value, state: '', city: '' })}>
            <option value="">Select country</option>
            {Object.keys(GEO).sort().map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="u-state">State<span className="opt">Optional</span></label>
          <select id="u-state" className="select" value={v.state} disabled={!v.country} onChange={(e) => set({ state: e.target.value, city: '' })}>
            <option value="">{v.country ? 'Select state' : 'Select a country first'}</option>
            {states.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="u-city">City<span className="opt">Optional</span></label><input id="u-city" className="input" placeholder={v.state ? 'City' : 'Select a state first'} disabled={!v.state} value={v.city} onChange={(e) => set({ city: e.target.value })} /></div>
        <div className="field"><label htmlFor="u-zip">Zipcode</label><input id="u-zip" className="input" placeholder="Zipcode" maxLength={12} value={v.zipcode} onChange={(e) => set({ zipcode: e.target.value })} />{err('zipcode')}</div>
      </div>
      </>)}
    </>
  )
}

/** "Create user" modal. `onCreate(cleanValues)` persists; the modal closes and toasts. */
export function CreateAdmin({ scope, people, preset, sub, onCreate, onClose }) {
  const toast = useToast()
  const f = useAdminForm(emptyAdmin(scope, preset), { scope, people })
  const submit = () => {
    if (!f.check()) return
    const v = clean(f.v)
    onCreate(v)
    onClose()
    toast(`${scope.role} created — invitation sent to ${v.email}`)
  }
  return (
    <Modal lg title="Create user" sub={sub} onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={submit}>Create user</button></>}>
      <AdminFields v={f.v} set={f.set} errors={f.errors} scope={scope} />
    </Modal>
  )
}

function Row({ label, children }) {
  return <div className="stack" style={{ gap: 2 }}><span className="hint">{label}</span><span>{children || <span className="muted">—</span>}</span></div>
}

/** View / edit drawer for one admin. `onSave(id, cleanValues)` persists. */
export function AdminProfile({ admin, scope, people, onSave, onClose, extra, actions }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const scopeName = scope.options.find((o) => o.id === admin[scope.key])?.name
  const f = useAdminForm({ ...emptyAdmin(scope), ...admin }, { scope, people, selfId: admin.id })
  const save = () => {
    if (!f.check()) return
    onSave(admin.id, clean(f.v)); setEditing(false); toast('Profile updated')
  }
  return (
    <Drawer onClose={onClose}>
      <div className="pane-head">
        <div className="row gap2"><Avatar name={adminName(admin)} /><div className="stack" style={{ gap: 2 }}><h2>{adminName(admin)}</h2><span className="muted small">{scope.role} · {scopeName}</span></div></div>
        <button className="btn ghost icon sm" onClick={onClose} aria-label="Close"><X /></button>
      </div>
      <div className="pane-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="row spread">{statusTag(admin.status)}<span className="hint">Added {admin.created}</span></div>
        {!editing ? (
          <>
            <section className="stack" style={{ gap: 12 }}>
              <span className="eyebrow">Profile</span>
              <Row label="First name">{admin.firstName}</Row>
              <Row label="Last name">{admin.lastName}</Row>
              <Row label={scope.label}>{scopeName}</Row>
              <Row label="Email">{admin.email}</Row>
              <Row label="Contact number">{admin.phone && `${admin.countryCode} ${admin.phone}`}</Row>
              {scope.showRole && <Row label="Role">{scope.role}</Row>}
              {scope.extraRows && scope.extraRows(admin).map(([l, val]) => <Row key={l} label={l}>{val}</Row>)}
            </section>
            {!scope.noAddress && (<>
            <div className="divider" />
            <section className="stack" style={{ gap: 12 }}>
              <span className="eyebrow">Address</span>
              <Row label="Address Line 1">{admin.address}</Row>
              <Row label="Country">{admin.country}</Row>
              <Row label="State">{admin.state}</Row>
              <Row label="City">{admin.city}</Row>
              <Row label="Zipcode">{admin.zipcode}</Row>
            </section>
            </>)}
            <div className="row wrap gap2">
              <button className="btn primary sm" onClick={() => setEditing(true)}><Pencil />Edit profile</button>
              {admin.status === 'Invited' && <button className="btn sm" onClick={() => toast(`Invitation re-sent to ${admin.email}`)}><Mail />Resend invitation</button>}
              {actions}
            </div>
          </>
        ) : (
          <>
            {/* The drawer is narrow: stack the two-column rows into one column. */}
            <div className="stack admin-compact" style={{ gap: 16 }}>
              <AdminFields v={f.v} set={f.set} errors={f.errors} scope={scope} lockScope lockEmail={admin.status !== 'Invited'} extra={extra} />
            </div>
            <div className="row gap2">
              <button className="btn primary sm" onClick={save}>Save changes</button>
              <button className="btn ghost sm" onClick={() => { f.reset(); setEditing(false) }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  )
}
