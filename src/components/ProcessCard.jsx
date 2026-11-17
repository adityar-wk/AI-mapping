import { ArrowRight, PenLine, Eye, Landmark, ShieldCheck, GraduationCap, Wallet, UserPlus, Megaphone } from 'lucide-react'
import { fmtDate } from '../data'
import { Seal } from './ui'

/*
  Process card — shows only what the platform actually records:
  name, department, category, keywords/tags (catalogued on approval, PRD FR-REP-02),
  status, version and last-updated date. No free-text change description:
  revision summaries live in version history (FR-REP-06), not on cards.
*/
const CAT_ICON = { Grants: Landmark, Compliance: ShieldCheck, 'Student records': GraduationCap, Finance: Wallet, Onboarding: UserPlus, Communications: Megaphone }
const STATUS = { draft: ['Draft', 'draft'], review: ['In review', 'review'], returned: ['Returned', 'returned'], approved: ['Approved', 'approved'] }

export default function ProcessCard({ p, onOpen, showDept, own = true, mine = false }) {
  const Icon = CAT_ICON[p.category] || Landmark
  const [label, cls] = STATUS[p.status]
  const editable = mine && (p.status === 'draft' || p.status === 'returned')
  const version = mine ? p.version : p.approvedVersion
  const ActionIcon = editable ? PenLine : mine && p.status === 'review' ? Eye : ArrowRight
  const showTags = p.status === 'approved' || !mine

  return (
    <button className="card pcard" onClick={onOpen}>
      <div className="pcard-top">
        <span className={`tile sm ${own ? '' : 'grey'}`}><Icon /></span>
        <Seal v={version} />
      </div>

      <div className="stack" style={{ gap: 4 }}>
        {showDept && <span className="pcard-dept">{p.dept}{own ? '' : ' · view-only'}</span>}
        <span className="pcard-title">{p.name}</span>
        <span className="pcard-meta">
          <span>{p.category}</span>
          {showTags && p.tags.map((t) => <span key={t} className="pcard-tag">#{t}</span>)}
        </span>
      </div>

      <div className="pcard-foot">
        {mine
          ? <span className={`tag ${cls}`}>{label}</span>
          : <span className="small ink2">{p.creator}</span>}
        <span className="hint">Updated {fmtDate(p.updated)}</span>
        <span className="btn round sm" aria-hidden><ActionIcon /></span>
      </div>
    </button>
  )
}
