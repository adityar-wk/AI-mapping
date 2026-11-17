# Process Atlas — UI (University of Dallas)

Front-end design build for the AI Process Mapping Platform (PRD v1.1, SOW Phase 1 v3).
React 18 + Vite + React Router. Mock data only — no backend calls.

```
npm install
npm run dev        # http://localhost:5173
```

Use **Design review · view as** (bottom of the sidebar) to switch between the five personas.
**Exception & access states** (same panel) shows the PRD §15 failure screens.

## Design system

Soft SaaS style: very light grey canvas, off-white cards with 20px corners and soft shadows, flat pill-shaped buttons (no shadows, no pure black or white fills) and inputs, small uppercase section labels, status shown as coloured text, tinted circular icon tiles.

| Token group | Values | Use |
|---|---|---|
| Brand | `--navy-deep #1d3c72`, `--navy #24498a`, `--navy-wash`, `--on-dark #f3f6fc` | Primary buttons, focus, active nav pill. UD navy is the only brand colour |
| Surfaces | `--paper #f6f7f8`, `--sheet #fdfdfd`, `--btn #f1f2f4`, `--well` | Canvas, cards, insets |
| Ink | `--ink` → `--ink-4` | Four text levels |
| Status | approved green, returned amber, brick | Status and destructive actions only |
| Type | Inter (everything), JetBrains Mono (versions, IDs) | |

**Component library:** `/components` (sidebar → Design review) renders every component from the same code the screens use.

## Screens by persona

| Persona | Route | Screen |
|---|---|---|
| All | `/login` | ADFS sign-in with institute resolution |
| All | `/components` | Component library |
| User | `/home` | My processes, returned feedback, start options |
| User | `/capture/new` | Voice/text capture, live transcript, clarifying questions, uploads |
| User | `/capture/:id/extraction` | Review and correct OCR-extracted content |
| User | `/process/:id/edit` | Map + document editor, AI revisions, manual edits, sync, submit |
| User / Supervisor | `/process/:id` | Approved process, version history, export, reopen |
| User | `/library` | Permission-scoped repository, search and filters |
| Supervisor | `/reviews` | Review queue |
| Supervisor | `/review/:id` | Review workspace (sources, AI review, direct edits, return, approve) |
| Supervisor | `/department-processes` | All department processes, filters |
| Dept Admin | `/dept` | Department summary |
| Dept Admin | `/dept/people` | Users, supervisors, reporting structure |
| Institute Admin | `/institute` | Institute overview |
| Institute Admin | `/institute/departments` | Create, edit, archive, delete departments |
| Institute Admin | `/institute/admins` | Assign or change Department Admins, reset password |
| Institute Admin | `/institute/access` | Grant and revoke cross-department library access |
| Institute Admin | `/institute/suspensions` | Suspend and restore users |
| Super Admin | `/platform` | Institutes: create, edit, activate, suspend, archive, Institute Admin |
| Super Admin | `/platform/usage` | Users, processes, storage, AI usage by institute |
| Super Admin | `/platform/settings` | Upload limit configuration |

## SOW coverage (§3.1–3.31)

| SOW | Feature | Where |
|---|---|---|
| 3.1 | ADFS SSO, institute resolution, profile linking, no-profile gate | Login; States (no profile) |
| 3.2 | Create process, voice/chat/upload input, PDF/DOCX/XLS/PNG/JPG, 25 MB / 100 pages / 10 files, rejection messages, retention | Capture → Supporting documents |
| 3.3 | OCR extraction, low-confidence flags, unreadable pages, review/correct text and tables, quality guidance | Extraction review |
| 3.4 | Live transcript, re-record a segment, edit transcript, voice clarifications/corrections, text-only AI replies | Capture (voice); Editor AI panel (Speak) |
| 3.5 | Chat description, chat corrections | Capture (text); Editor AI panel |
| 3.6 | Clarifying questions; steps, roles, decisions, triggers, endpoints, loops, parallel | Capture → Captured so far, Open questions |
| 3.7 | Swimlane generation, automatic layout, re-apply layout | Swimlane component; Auto layout button |
| 3.8 | Edit label (form), mark decision/endpoint, add/remove/modify connections, drag-and-drop, save/reopen draft. No zoom/pan/undo (excluded) | Editor → Edit map; Save draft |
| 3.9 | 13 document fields, document updates, missing fields flagged rather than invented | ProcessDoc |
| 3.10 | AI revisions update both outputs; mismatch indicator; explicit Update document / Update map | Editor sync bar; AI proposal card |
| 3.11 | One active draft, submit to assigned supervisor, lock during review, new draft after approval | Submit dialog; locked view; Reopen |
| 3.12 | Notification; view map, document, source documents, extracted info; voice/chat review; direct supervisor edits | Review workspace (Sources tab) |
| 3.13 | Approve and lock, notify author with outcome, reopen as new draft, department process access and version info | Approve dialog; Process view; Department processes |
| 3.14 | Department libraries, categories/tags, keyword search, filter by creator/date/category/tag, grouped by department, cross-department view-only | Library |
| 3.15 | Separate versions, history with user, timestamp, summary, last change; deactivated approver preserved | Process view → Version history |
| 3.16 | Department summary: users, supervisors, processes | Dept dashboard |
| 3.17 | Create supervisor (name, email, team), edit, deactivate (reassign first), delete only without history | People → Supervisors |
| 3.18 | Create/edit user, assign/reassign supervisor, deactivate (transfer drafts), delete only without history | People → Users, Reporting structure |
| 3.19 | Department overview/status, create (name, description), edit, delete restrictions, archive | Institute overview; Departments |
| 3.20 | Assign Department Admin at creation, reset Department Admin password | Departments (create); Department admins |
| 3.21 | Grant/revoke person- and department-level access, view-only, same institute | Library access |
| 3.22 | Suspend user, sessions revoked | User suspension; States |
| 3.23 | Create institute with tenant ID, edit settings, activate/suspend, archive | Institutes + drawer |
| 3.24 | Assign/change/remove Institute Admin | Institutes drawer |
| 3.25 | User, process, storage and AI usage by institute (no billing) | Usage |
| 3.26 | Configurable upload limits, formats fixed | Upload limits |
| 3.27–3.28 | Tenant isolation, session revocation | Tenant chip/IDs; States (suspended, session ended, access denied) |
| 3.29 | Submission and review-outcome notifications, email + in-app, delivery failure | Notifications drawer |
| 3.30 | In-app viewing; map export PDF/PNG; document export PDF/DOCX; version-specific export | Export dialog |
| 3.31 | AI interpretation, OCR, human validation | Capture, Extraction, Editor, Review |

PRD §15 exception cases EC-01 to EC-18 are mapped on the **Exception & access states** screen.

**Not included:** SOW 3.32 (testing/deployment) and 3.33 (GLR Live Events integration). Neither involves screens in this product.
