import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CornerUpLeft, BadgeCheck, Inbox, AlertTriangle, UserCheck } from 'lucide-react'

/*
  One notification control for every persona that receives notifications
  (SOW 3.29: Users get review outcomes, Supervisors get submissions;
  Department Admins get people and reporting-line alerts).
  Always the last item in the top bar; opens a fixed-size window anchored
  under the bell — never a full-height panel.
*/
const ICON = { returned: CornerUpLeft, approved: BadgeCheck, review: Inbox, attention: AlertTriangle, people: UserCheck }
const TONE = { returned: 'amber', approved: 'green', review: '', attention: 'amber', people: 'green' }

export default function NotificationBell({ items }) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState(items)
  const ref = useRef(null)
  const nav = useNavigate()
  const unread = list.filter((n) => n.unread).length

  useEffect(() => { setList(items) }, [items])
  useEffect(() => {
    if (!open) return
    const out = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', out)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div className="notif" ref={ref}>
      <button className={`btn icon notif-trigger ${open ? 'on' : ''}`} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Bell />
        {unread > 0 && <span className="notif-count">{unread}</span>}
      </button>

      {open && (
        <div className="notif-pop" role="dialog" aria-label="Notifications">
          <div className="notif-head">
            <span style={{ fontWeight: 650 }}>Notifications</span>
            <button className="btn ghost sm" disabled={!unread} onClick={() => setList((l) => l.map((n) => ({ ...n, unread: false })))}><Check />Mark all read</button>
          </div>
          <div className="notif-body">
            {list.map((n) => {
              const I = ICON[n.kind] || Bell
              return (
                <button key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`} onClick={() => { setOpen(false); nav(n.to) }}>
                  <span className={`tile sm ${TONE[n.kind] || ''}`}><I /></span>
                  <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                    <span className="notif-title">{n.title}</span>
                    <span className="small ink2 notif-text">{n.body}</span>
                    <span className="hint">{n.at}</span>
                    {n.failed && <span className="hint row" style={{ gap: 4, color: 'var(--returned)' }}><AlertTriangle size={11} />Email didn’t send — retrying</span>}
                  </span>
                  {n.unread && <span className="dot" style={{ marginTop: 6 }} />}
                </button>
              )
            })}
          </div>
          <div className="notif-foot hint">Sent in the app and by email</div>
        </div>
      )}
    </div>
  )
}
