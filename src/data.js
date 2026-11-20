// Mock data for the design build. Shapes mirror the PRD data model (§11)
// so engineering can swap these for API calls without touching screens.

export const INSTITUTE = {
  id: 'udallas',
  tenant: 'tnt_7f3a91c2',
  name: 'University of Dallas',
  short: 'UD',
  domain: 'udallas.edu',
}

export const PERSONAS = {
  user: { key: 'user', role: 'User', name: 'Maria Okafor', initials: 'MO', email: 'mokafor@udallas.edu', dept: 'Office of Sponsored Programs', supervisor: 'Daniel Reyes' },
  supervisor: { key: 'supervisor', role: 'Supervisor', name: 'Daniel Reyes', initials: 'DR', email: 'dreyes@udallas.edu', dept: 'Office of Sponsored Programs' },
  deptAdmin: { key: 'deptAdmin', role: 'Department Admin', name: 'Priya Natarajan', initials: 'PN', email: 'pnatarajan@udallas.edu', dept: 'Office of Sponsored Programs' },
  instAdmin: { key: 'instAdmin', role: 'Institute Admin', name: 'Thomas Healy', initials: 'TH', email: 'thealy@udallas.edu', dept: 'Office of the Provost' },
  superAdmin: { key: 'superAdmin', role: 'Super Admin', name: 'Platform Operations', initials: 'PO', email: 'ops@processatlas.app', dept: 'Platform' },
}

export const DEPARTMENTS = [
  { id: 'osp', name: 'Office of Sponsored Programs', desc: 'Pre-award and post-award grant administration.', admins: ['Priya Natarajan', 'Julian Park'], users: 14, supervisors: 3, processes: 22, status: 'Active' },
  { id: 'reg', name: 'Office of the Registrar', desc: 'Enrollment records, transcripts, degree audit.', admins: ['Kevin Marsh'], users: 19, supervisors: 4, processes: 31, status: 'Active' },
  { id: 'fa', name: 'Financial Aid', desc: 'Aid packaging, verification and disbursement.', admins: ['Alicia Gomez', 'Omar Haddad'], users: 11, supervisors: 2, processes: 17, status: 'Active' },
  { id: 'car', name: 'Career Services', desc: 'Student career readiness and employer relations.', admins: ['Jonah Pierce'], users: 8, supervisors: 2, processes: 9, status: 'Active' },
  { id: 'mkt', name: 'Marketing & Communications', desc: 'Brand, web and campaign operations.', admins: ['Sara Lindqvist'], users: 9, supervisors: 2, processes: 12, status: 'Active' },
  { id: 'hr', name: 'Human Resources', desc: 'Hiring, onboarding and employee records.', admins: [], users: 0, supervisors: 0, processes: 0, status: 'Setup pending' },
  { id: 'cce', name: 'Continuing Education', desc: 'Merged into the Braniff Graduate School in 2025.', admins: [], users: 0, supervisors: 0, processes: 6, status: 'Archived' },
]

export const adminEmail = (name, domain = 'udallas.edu') => `${name.split(' ')[0][0]}${name.split(' ').slice(-1)[0]}@${domain}`.toLowerCase()

export const CATEGORIES = ['Grants', 'Compliance', 'Student records', 'Finance', 'Onboarding', 'Communications']

// status: draft | review | returned | approved
export const PROCESSES = [
  { id: 'p-104', name: 'Grant pre-award proposal routing', dept: 'Office of Sponsored Programs', category: 'Grants', tags: ['pre-award', 'routing', 'budget'], creator: 'Maria Okafor', owner: 'Director, Sponsored Programs', status: 'draft', version: '3.0', approvedVersion: '2.1', updated: '2026-11-16T15:42:00', supervisor: 'Daniel Reyes' },
  { id: 'p-118', name: 'Subaward agreement setup', dept: 'Office of Sponsored Programs', category: 'Grants', tags: ['subaward', 'contracts'], creator: 'Maria Okafor', owner: 'Grants Contract Officer', status: 'review', version: '1.0', approvedVersion: null, updated: '2026-11-14T10:05:00', supervisor: 'Daniel Reyes' },
  { id: 'p-097', name: 'Effort certification cycle', dept: 'Office of Sponsored Programs', category: 'Compliance', tags: ['effort', 'federal'], creator: 'Maria Okafor', owner: 'Compliance Analyst', status: 'returned', version: '1.0', approvedVersion: null, updated: '2026-11-12T09:30:00', supervisor: 'Daniel Reyes', feedback: 'The PI attestation step is missing the 30-day deadline and what happens when a PI does not respond. Please add the escalation path to the department chair.' },
  { id: 'p-082', name: 'No-cost extension request', dept: 'Office of Sponsored Programs', category: 'Grants', tags: ['post-award', 'extension'], creator: 'Maria Okafor', owner: 'Director, Sponsored Programs', status: 'approved', version: '1.2', approvedVersion: '1.2', updated: '2026-10-28T14:12:00', supervisor: 'Daniel Reyes' },
  { id: 'p-131', name: 'Cost-share documentation', dept: 'Office of Sponsored Programs', category: 'Finance', tags: ['cost-share', 'budget'], creator: 'Leo Brandt', owner: 'Grants Accountant', status: 'review', version: '2.0', approvedVersion: '1.0', updated: '2026-11-15T16:20:00', supervisor: 'Daniel Reyes' },
  { id: 'p-140', name: 'Award acceptance and account setup', dept: 'Office of Sponsored Programs', category: 'Grants', tags: ['award', 'banner'], creator: 'Hannah Cole', owner: 'Grants Accountant', status: 'review', version: '1.0', approvedVersion: null, updated: '2026-11-16T11:48:00', supervisor: 'Daniel Reyes' },
  { id: 'p-021', name: 'Transcript request fulfilment', dept: 'Office of the Registrar', category: 'Student records', tags: ['transcript', 'parchment'], creator: 'Kevin Marsh', owner: 'Associate Registrar', status: 'approved', version: '4.0', approvedVersion: '4.0', updated: '2026-09-30T08:10:00', crossDept: true },
  { id: 'p-034', name: 'Grade change approval', dept: 'Office of the Registrar', category: 'Student records', tags: ['grades', 'faculty'], creator: 'Rosa Diaz', owner: 'Registrar', status: 'approved', version: '2.3', approvedVersion: '2.3', updated: '2026-10-11T13:40:00', crossDept: true },
  { id: 'p-056', name: 'Federal verification (V1–V6)', dept: 'Financial Aid', category: 'Compliance', tags: ['FAFSA', 'verification'], creator: 'Alicia Gomez', owner: 'Director of Financial Aid', status: 'approved', version: '3.1', approvedVersion: '3.1', updated: '2026-10-02T10:00:00', crossDept: false, restricted: true },
  { id: 'p-063', name: 'Student profile onboarding (Career Connect)', dept: 'Career Services', category: 'Onboarding', tags: ['handshake', 'students'], creator: 'Jonah Pierce', owner: 'Career Advisor', status: 'approved', version: '1.0', approvedVersion: '1.0', updated: '2026-08-21T09:00:00', crossDept: true },
  { id: 'p-071', name: 'Campaign request intake (Level Up)', dept: 'Marketing & Communications', category: 'Communications', tags: ['campaign', 'intake'], creator: 'Sara Lindqvist', owner: 'Marketing Manager', status: 'approved', version: '2.0', approvedVersion: '2.0', updated: '2026-07-14T15:30:00', crossDept: true },
  { id: 'p-012', name: 'Non-credit course registration', dept: 'Continuing Education', category: 'Student records', tags: ['non-credit'], creator: 'Former staff', owner: 'Program Coordinator', status: 'approved', version: '1.4', approvedVersion: '1.4', updated: '2025-04-02T09:00:00', crossDept: true, archivedDept: true },
]

export const VERSIONS = [
  { v: '3.0', state: 'draft', reopened: true, by: 'Daniel Reyes', at: '2026-11-10T09:14:00', summary: 'Reopened to add the federal sponsor compliance check and revise budget routing.', lastBy: 'Maria Okafor', lastAt: '2026-11-16T15:42:00' },
  { v: '2.1', state: 'current', by: 'Daniel Reyes', at: '2026-06-03T11:20:00', summary: 'Dean sign-off moved after chair approval; added loop when chair requests budget revisions.', author: 'Maria Okafor' },
  { v: '2.0', state: 'historical', by: 'Daniel Reyes', at: '2026-03-18T16:05:00', summary: 'Added parallel compliance-forms track run by the Sponsored Programs Officer.', author: 'Maria Okafor' },
  { v: '1.0', state: 'historical', by: 'Angela Wu', at: '2025-11-02T10:40:00', summary: 'First approved version, captured from the 2025 OSP procedures binder.', author: 'Maria Okafor', note: 'Approver deactivated 2026-01 — record preserved' },
]

// ── Swimlane model for p-104 ──────────────────────────────────
export const LANES = [
  { id: 'pi', name: 'Principal Investigator' },
  { id: 'spo', name: 'Sponsored Programs Officer' },
  { id: 'chair', name: 'Department Chair' },
  { id: 'dean', name: 'Dean' },
]

export const NODES = [
  { id: 'n1', lane: 'pi', col: 0, type: 'start', label: 'Funding opportunity identified' },
  { id: 'n2', lane: 'pi', col: 1, type: 'task', label: 'Submit intent to apply' },
  { id: 'n3', lane: 'spo', col: 2, type: 'task', label: 'Review eligibility and sponsor deadline' },
  { id: 'n4', lane: 'spo', col: 3, type: 'decision', label: 'Eligible?' },
  { id: 'n5', lane: 'pi', col: 3, type: 'end', label: 'Not eligible — PI notified' },
  { id: 'n6', lane: 'spo', col: 4, type: 'parallel', label: 'Split' },
  { id: 'n7', lane: 'pi', col: 5, type: 'task', label: 'Draft budget and narrative' },
  { id: 'n8', lane: 'spo', col: 5, type: 'task', label: 'Prepare compliance forms' },
  { id: 'n9', lane: 'spo', col: 6, type: 'parallel', label: 'Join' },
  { id: 'n10', lane: 'chair', col: 7, type: 'task', label: 'Review proposal package' },
  { id: 'n11', lane: 'chair', col: 8, type: 'decision', label: 'Chair approves?' },
  { id: 'n12', lane: 'dean', col: 9, type: 'task', label: 'Dean sign-off' },
  { id: 'n13', lane: 'spo', col: 10, type: 'task', label: 'Submit through sponsor portal' },
  { id: 'n14', lane: 'spo', col: 11, type: 'end', label: 'Proposal submitted' },
]

export const EDGES = [
  { id: 'e1', from: 'n1', to: 'n2' },
  { id: 'e2', from: 'n2', to: 'n3' },
  { id: 'e3', from: 'n3', to: 'n4' },
  { id: 'e4', from: 'n4', to: 'n5', label: 'No' },
  { id: 'e5', from: 'n4', to: 'n6', label: 'Yes' },
  { id: 'e6', from: 'n6', to: 'n7' },
  { id: 'e7', from: 'n6', to: 'n8' },
  { id: 'e8', from: 'n7', to: 'n9' },
  { id: 'e9', from: 'n8', to: 'n9' },
  { id: 'e10', from: 'n9', to: 'n10' },
  { id: 'e11', from: 'n10', to: 'n11' },
  { id: 'e12', from: 'n11', to: 'n12', label: 'Yes' },
  { id: 'e13', from: 'n11', to: 'n7', label: 'Revise', loop: true },
  { id: 'e14', from: 'n12', to: 'n13' },
  { id: 'e15', from: 'n13', to: 'n14' },
]

export const DOC = {
  name: 'Grant pre-award proposal routing',
  owner: 'Director, Office of Sponsored Programs',
  operator: 'Sponsored Programs Officer',
  purpose: 'Ensure every external funding proposal is eligible, budgeted, approved by the right academic officers and submitted before the sponsor deadline.',
  scope: 'All externally sponsored research and program proposals originating from UD faculty and staff. Excludes internal seed grants and gifts processed by Advancement.',
  stakeholders: 'Principal Investigator; Sponsored Programs Officer; Department Chair; Dean; Grants Accountant (informed).',
  triggers: 'A PI identifies a funding opportunity and intends to apply.',
  inputs: 'Funding opportunity announcement; intent-to-apply form; draft budget; project narrative.',
  outputs: 'Submitted proposal with sponsor confirmation; routing record with approvals.',
  systems: 'Cayuse SP; Grants.gov / sponsor portal; Banner Finance.',
  permissions: 'Only the SPO submits to the sponsor. Chair and Dean approvals are recorded in Cayuse.',
  exceptions: null, // intentionally missing → shows "needs clarification"
}

export const SUPERVISORS = [
  { id: 's1', name: 'Daniel Reyes', email: 'dreyes@udallas.edu', team: 'Pre-award', users: 5, pending: 3, status: 'Active', history: true },
  { id: 's2', name: 'Angela Wu', email: 'awu@udallas.edu', team: 'Post-award', users: 0, pending: 0, status: 'Deactivated', history: true },
  { id: 's3', name: 'Marcus Bell', email: 'mbell@udallas.edu', team: 'Compliance', users: 4, pending: 1, status: 'Active', history: true },
  { id: 's4', name: 'Grace Tran', email: 'gtran@udallas.edu', team: 'Post-award', users: 0, pending: 0, status: 'Invited', history: false },
]

export const USERS = [
  { id: 'u1', name: 'Maria Okafor', email: 'mokafor@udallas.edu', supervisor: 'Daniel Reyes', drafts: 1, processes: 4, status: 'Active', history: true, lastActive: '2026-11-16' },
  { id: 'u2', name: 'Leo Brandt', email: 'lbrandt@udallas.edu', supervisor: 'Daniel Reyes', drafts: 0, processes: 3, status: 'Active', history: true, lastActive: '2026-11-15' },
  { id: 'u3', name: 'Hannah Cole', email: 'hcole@udallas.edu', supervisor: 'Daniel Reyes', drafts: 0, processes: 2, status: 'Active', history: true, lastActive: '2026-11-16' },
  { id: 'u4', name: 'Samuel Ortiz', email: 'sortiz@udallas.edu', supervisor: 'Marcus Bell', drafts: 2, processes: 5, status: 'Active', history: true, lastActive: '2026-11-11' },
  { id: 'u5', name: 'Nora Feld', email: 'nfeld@udallas.edu', supervisor: null, drafts: 0, processes: 0, status: 'Invited', history: false, lastActive: '—' },
  { id: 'u6', name: 'Ian Whitaker', email: 'iwhitaker@udallas.edu', supervisor: 'Marcus Bell', drafts: 1, processes: 6, status: 'Deactivated', history: true, lastActive: '2026-09-02' },
]

export const GRANTS = [
  { id: 'g2', kind: 'Department', who: 'Office of Sponsored Programs', target: 'Career Services', by: 'Thomas Healy', at: '2026-08-12' },
  { id: 'g3', kind: 'Department', who: 'Financial Aid', target: 'Office of the Registrar', by: 'Thomas Healy', at: '2026-05-20' },
  { id: 'g5', kind: 'Department', who: 'Office of Sponsored Programs', target: 'Marketing & Communications', by: 'Thomas Healy', at: '2026-10-22' },
]

export const INSTITUTES = [
  { id: 'udallas', name: 'University of Dallas', branch: 'Irving campus', type: 'University', website: 'https://udallas.edu', email: 'info@udallas.edu', phones: [{ label: 'Main', number: '+1 972-721-5000' }, { label: 'IT help desk', number: '+1 972-721-5300' }], address: { line1: '1845 E Northgate Dr', line2: '', city: 'Irving', state: 'TX', postal: '75062', country: 'United States' }, timezone: 'America/Chicago', tenant: 'tnt_7f3a91c2', domain: 'udallas.edu', admin: 'Thomas Healy', status: 'Active', users: 61, processes: 97, storage: 18.4, storageCap: 50, ai: 412_000, created: '2026-05-12' },
  { id: 'smu-pilot', name: 'Northlake Community College', branch: 'Main campus', type: 'Community college', website: 'https://northlake.edu', email: 'contact@northlake.edu', phones: [{ label: 'Main', number: '+1 214-555-0140' }], address: { line1: '5001 N MacArthur Blvd', line2: '', city: 'Irving', state: 'TX', postal: '75038', country: 'United States' }, timezone: 'America/Chicago', tenant: 'tnt_2b81d0e4', domain: 'northlake.edu', admin: 'Renee Castillo', status: 'Active', users: 23, processes: 31, storage: 6.1, storageCap: 50, ai: 158_000, created: '2026-08-01' },
  { id: 'stmary', name: 'St. Brendan Seminary', branch: '', type: 'Seminary', website: 'https://stbrendan.org', email: 'office@stbrendan.org', phones: [{ label: 'Main', number: '+1 312-555-0188' }], address: { line1: '200 Abbey Rd', line2: '', city: 'Chicago', state: 'IL', postal: '60614', country: 'United States' }, timezone: 'America/Chicago', tenant: 'tnt_c40e7a11', domain: 'stbrendan.org', admin: null, status: 'Suspended', users: 9, processes: 4, storage: 0.8, storageCap: 20, ai: 12_400, created: '2026-03-03' },
  { id: 'old', name: 'Trinity Valley Institute', branch: 'Downtown campus', type: 'College', website: 'https://tvi.edu', email: 'registrar@tvi.edu', phones: [], address: { line1: '90 Commerce St', line2: 'Suite 400', city: 'Fort Worth', state: 'TX', postal: '76102', country: 'United States' }, timezone: 'America/Chicago', tenant: 'tnt_99ad0f52', domain: 'tvi.edu', admin: 'Mark Ellison', status: 'Archived', users: 0, processes: 48, storage: 9.7, storageCap: 50, ai: 0, created: '2025-09-15' },
]

export const NOTIFICATIONS = {
  user: [
    { id: 1, kind: 'returned', title: 'Effort certification cycle was returned', body: 'Daniel Reyes: "The PI attestation step is missing the 30-day deadline…"', at: '2 days ago', to: '/process/p-097/edit', unread: true, channel: 'In-app · Email' },
    { id: 2, kind: 'approved', title: 'No-cost extension request approved as v1.2', body: 'Published to the Office of Sponsored Programs library.', at: 'Oct 28', to: '/process/p-082', unread: false, channel: 'In-app · Email' },
  ],
  supervisor: [
    { id: 3, kind: 'review', title: 'Award acceptance and account setup submitted', body: 'Hannah Cole submitted v1.0 for your review.', at: '4 hours ago', to: '/review/p-140', unread: true, channel: 'In-app · Email' },
    { id: 4, kind: 'review', title: 'Cost-share documentation resubmitted', body: 'Leo Brandt submitted v2.0 for your review.', at: 'Yesterday', to: '/review/p-131', unread: true, channel: 'In-app · Email' },
    { id: 5, kind: 'review', title: 'Subaward agreement setup submitted', body: 'Maria Okafor submitted v1.0 for your review.', at: 'Nov 14', to: '/review/p-118', unread: false, channel: 'In-app · Email', failed: true },
  ],
}

// ── Records kept with a process, used wherever a screen summarises its sources ──
// files: uploaded originals; decisions: what the author chose on Review extracted content;
// capture: counted from the saved capture session.
export const SOURCES = {
  'p-104': {
    files: [
      { name: 'OSP_PreAward_Procedures_2025.pdf', ext: 'pdf', meta: '38 pages', usedIn: ['1.0', '2.0', '3.0'], confirmed: true },
      { name: 'Routing_checklist.xlsx', ext: 'xls', meta: '2 sheets', usedIn: ['2.1', '3.0'], confirmed: true },
    ],
    decisions: [
      { item: '§ 4.2 Eligibility review', outcome: 'Confirmed as extracted' },
      { item: '§ 4.3 Routing timeline', outcome: 'Corrected by author: “5 business days”' },
      { item: '§ 4.4 Compliance forms', outcome: 'Corrected by author: “Cayuse SP”, “IRB protocol numbers”' },
      { item: 'Dean threshold conflict', outcome: 'Author chose: document ($250k threshold)' },
      { item: 'Page 14', outcome: 'Unreadable — excluded', warn: true },
    ],
    capture: { messages: 12, voiceSeconds: 260 },
  },
}
export const sourcesFor = (id) => SOURCES[id] || { files: [], decisions: [], capture: null }

// ── Department summary numbers are always counted from the records, never typed in ──
const OSP = 'Office of Sponsored Programs'
const ospDept = DEPARTMENTS.find((d) => d.name === OSP)
ospDept.users = USERS.length
ospDept.supervisors = SUPERVISORS.length
ospDept.processes = PROCESSES.filter((p) => p.dept === OSP).length

export const fmtDuration = (sec) => `${Math.floor(sec / 60)} min ${sec % 60} s`
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
export const greeting = (d = new Date()) => (d.getHours() < 12 ? 'Good morning' : d.getHours() < 17 ? 'Good afternoon' : 'Good evening')

export const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
export const fmtDateTime = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
export const initials = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('')
