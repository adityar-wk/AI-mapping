import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { X, Lock, PenLine, Eye, CornerUpLeft, BadgeCheck, CheckCircle2, SlidersHorizontal } from 'lucide-react'
import { initials } from '../data'

export const STATUS = {
  draft: { label: 'Draft', cls: 'draft' },
  review: { label: 'Under review', cls: 'review' },
  returned: { label: 'Returned for corrections', cls: 'returned' },
  approved: { label: 'Approved', cls: 'approved' },
}

export function Tag({ status, children, kind }) {
  const s = STATUS[status]
  return <span className={`tag ${kind || s?.cls || 'outline'}`}>{children || s?.label}</span>
}

/* Version seal — the map + document pair always travel as one version */
/* Version — just the number. Status is shown separately where it matters. */
export function Seal({ v }) {
  return <span className="ver" title="Map and document share this version">v{v}</span>
}

/* Lifecycle rail — PRD §10 states */
export function Rail({ status }) {
  const order = ['draft', 'review', 'approved']
  const idx = status === 'returned' ? 1 : order.indexOf(status)
  const steps = [
    { k: 'draft', label: 'Draft' },
    { k: 'review', label: status === 'returned' ? 'Returned' : 'Under review' },
    { k: 'approved', label: 'Approved' },
  ]
  return (
    <div className="rail" aria-label={`Status: ${STATUS[status].label}`}>
      {steps.map((s, i) => (
        <div key={s.k} className="row" style={{ gap: 0 }}>
          {i > 0 && <span className={`rail-line ${i <= idx ? 'done' : ''}`} />}
          <span className={`rail-step ${i < idx ? 'done' : ''} ${i === idx ? 'now' : ''} ${i === idx && status === 'returned' ? 'returned' : ''} ${i === idx && status === 'approved' ? 'approved' : ''}`}>
            <span className="rail-dot" />{s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function Avatar({ name, sm }) {
  return <span className={`avatar ${sm ? 'sm' : ''}`} aria-hidden>{initials(name || '?')}</span>
}

export function Modal({ title, sub, onClose, children, foot, lg }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dialog ${lg ? 'lg' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-head">
          <div className="stack gap1">
            <h2>{title}</h2>
            {sub && <p className="muted small">{sub}</p>}
          </div>
          <button className="btn ghost icon sm" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <div className="dialog-body">{children}</div>
        {foot && <div className="dialog-foot">{foot}</div>}
      </div>
    </div>
  )
}

export function Drawer({ onClose, children }) {
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer">{children}</aside>
    </>
  )
}

/* Menus open downward, and flip upward when there isn't room below the trigger */
export function Dropdown({ trigger, children, align = 'right', width, up, keepOpen }) {
  const [open, setOpen] = useState(false)
  const [flip, setFlip] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect()
      setFlip(up || (window.innerHeight - r.bottom < 260 && r.top > window.innerHeight - r.bottom))
    }
    setOpen((o) => !o)
  }
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger({ open, toggle })}
      {open && (
        <div className="menu" style={{ [flip ? 'bottom' : 'top']: 'calc(100% + 6px)', [align]: 0, width }} onClick={keepOpen ? undefined : () => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  )
}

/* Filter icon button: all filter groups in one popover, badge shows how many are active */
export function FilterButton({ groups, values, onChange, onClear }) {
  const active = groups.filter((g) => values[g.key] && values[g.key] !== g.options[0][0]).length
  return (
    <Dropdown align="left" width={260} keepOpen trigger={({ toggle, open }) => (
      <button className={`btn icon filter-btn ${open ? 'on' : ''}`} onClick={toggle} data-tip="Filters" aria-label={`Filters${active ? `, ${active} active` : ''}`}>
        <SlidersHorizontal />
        {active > 0 && <span className="filter-count">{active}</span>}
      </button>
    )}>
      {groups.map((g) => (
        <div key={g.key} className="filter-group">
          <div className="menu-label">{g.label}</div>
          {g.options.map(([v, l]) => (
            <label key={v} className="filter-opt">
              <input type="radio" name={g.key} checked={(values[g.key] || g.options[0][0]) === v} onChange={() => onChange(g.key, v)} />
              <span className="grow">{l}</span>
            </label>
          ))}
        </div>
      ))}
      <div className="filter-foot"><button className="btn ghost sm" disabled={!active} onClick={onClear}>Clear filters</button></div>
    </Dropdown>
  )
}

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastHost({ children }) {
  const [t, setT] = useState(null)
  useEffect(() => {
    if (!t) return
    const id = setTimeout(() => setT(null), 3200)
    return () => clearTimeout(id)
  }, [t])
  return (
    <ToastCtx.Provider value={setT}>
      {children}
      {t && <div className="toast" role="status"><CheckCircle2 />{t}</div>}
    </ToastCtx.Provider>
  )
}

export function Empty({ icon, title, body, action }) {
  return (
    <div className="empty">
      {icon}
      <div style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{title}</div>
      {body && <div className="small" style={{ maxWidth: '44ch' }}>{body}</div>}
      {action}
    </div>
  )
}

export function LockedNote({ children }) {
  return <div className="lock-banner"><Lock />{children}</div>
}

export function FileIcon({ ext }) {
  return <span className="file-ic">{ext.toUpperCase()}</span>
}
