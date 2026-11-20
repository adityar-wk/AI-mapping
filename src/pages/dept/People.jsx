import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UserPlus, MoreHorizontal, PenLine, UserX, Trash2, ArrowRightLeft, Search, Mail, ShieldCheck, Info, Users, AlertTriangle } from 'lucide-react'
import { Topbar } from '../../App'
import { USERS, SUPERVISORS } from '../../data'
import { Avatar, Dropdown, Modal, Tag, useToast } from '../../components/ui'

const statusTag = (s) => <Tag kind={s === 'Active' ? 'approved' : s === 'Invited' ? 'review' : 'draft'}>{s}</Tag>

export default function People({ title = 'Users & supervisors', lede, summary }) {
  const [qs] = useSearchParams()
  const toast = useToast()
  const [tab, setTab] = useState(qs.get('tab') || 'users')
  const [users, setUsers] = useState(USERS)
  const [sups] = useState(SUPERVISORS)
  const [dlg, setDlg] = useState(qs.get('new') ? { kind: 'create' } : null)
  const [q, setQ] = useState('')
  const activeSups = sups.filter((s) => s.status !== 'Deactivated')
  const teams = [...new Set(sups.map((s) => s.team))]

  const setSup = (uid, sup) => { setUsers((u) => u.map((x) => (x.id === uid ? { ...x, supervisor: sup } : x))); toast(`Supervisor changed to ${sup}`) }

  return (
    <>
      <Topbar title={title}>
        <button className="btn primary" onClick={() => setDlg({ kind: 'create' })}><UserPlus />Add person</button>
      </Topbar>
      <div className="page">
        <div className="page-head">
          <div><p className="lede">{lede || 'Platform profiles link to existing UD accounts. Adding someone sends an invitation; they sign in with ADFS — no new passwords.'}</p></div>
        </div>
        {summary}
        {summary && <h2 style={{ fontSize: 16, marginTop: 8 }}>Users & supervisors</h2>}

        <div className="tabs">
            <button className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>Users <span className="hint num">{users.length}</span></button>
            <button className={tab === 'sups' ? 'on' : ''} onClick={() => setTab('sups')}>Supervisors <span className="hint num">{sups.length}</span></button>
            <button className={tab === 'structure' ? 'on' : ''} onClick={() => setTab('structure')}>Reporting structure</button>
        </div>

        <div className="search" style={{ width: 300, marginBottom: -8 }}>
          <Search />
          <input className="input" aria-label="Search people" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={tab === 'users' ? 'Search users by name or email' : tab === 'sups' ? 'Search supervisors by name or email' : 'Search supervisors or team members'} />
        </div>

        {tab === 'users' && (
          <div className="card">
            <table className="table">
              <thead><tr><th>Name</th><th>Supervisor</th><th className="right">Processes</th><th>Status</th><th>Last active</th><th className="actions" /></tr></thead>
              <tbody>
                {users.filter((u) => !q || (u.name + u.email).toLowerCase().includes(q.toLowerCase())).map((u) => (
                  <tr key={u.id}>
                    <td><div className="row gap2"><Avatar name={u.name} /><div className="stack" style={{ gap: 0 }}><span className="t-title">{u.name}</span><span className="hint">{u.email}</span></div></div></td>
                    <td>
                      {u.status === 'Deactivated' ? <span className="muted">—</span>
                        : u.supervisor ? <span className="row gap2"><Avatar name={u.supervisor} sm />{u.supervisor}</span>
                          : <span style={{ color: 'var(--returned)', fontWeight: 500 }}>Not assigned</span>}
                    </td>
                    <td className="right num ink2">{u.processes}{u.drafts > 0 && <span className="hint"> · {u.drafts} draft</span>}</td>
                    <td>{statusTag(u.status)}</td>
                    <td className="ink2 num">{u.lastActive}</td>
                    <td className="actions"><RowMenu person={u} kind="user" onPick={(k) => setDlg({ kind: k, person: u, role: 'user' })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'sups' && (
          <div className="stack gap4">
            {/* a team can have several supervisors */}
            {teams.map((t) => {
              const list = sups.filter((s) => s.team === t && (!q || (s.name + s.email + s.team).toLowerCase().includes(q.toLowerCase())))
              if (!list.length) return null
              const active = list.filter((s) => s.status !== 'Deactivated').length
              return (
                <div key={t} className="card">
                  <div className="card-head">
                    <div className="stack" style={{ gap: 1 }}><h3>{t}</h3><span className="hint">{active} active supervisor{active === 1 ? '' : 's'} · {users.filter((u) => u.status !== 'Deactivated' && list.some((s) => s.name === u.supervisor)).length} users</span></div>
                    <button className="btn sm" onClick={() => setDlg({ kind: 'create', role: 'supervisor', team: t })}><UserPlus />Add supervisor to {t}</button>
                  </div>
                  <table className="table">
                    <thead><tr><th>Name</th><th className="right">Users</th><th className="right">Pending reviews</th><th>Status</th><th className="actions" /></tr></thead>
                    <tbody>
                      {list.map((s) => (
                        <tr key={s.id}>
                          <td><div className="row gap2"><Avatar name={s.name} /><div className="stack" style={{ gap: 0 }}><span className="t-title">{s.name}</span><span className="hint">{s.isAdmin ? <b style={{ color: 'var(--navy)', fontWeight: 600 }}>Department admin · </b> : null}{s.email}</span></div></div></td>
                          <td className="right num">{users.filter((u) => u.supervisor === s.name && u.status !== 'Deactivated').length}</td>
                          <td className="right num">{s.pending}</td>
                          <td>{statusTag(s.status)}{s.status === 'Deactivated' && <div className="hint">Approvals kept in history</div>}</td>
                          <td className="actions">{!s.isAdmin && <RowMenu person={s} kind="supervisor" onPick={(k) => setDlg({ kind: k, person: s, role: 'supervisor' })} />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'structure' && (
          <ReportingStructure users={users} sups={activeSups} q={q}
            onAdd={(sup) => setDlg({ kind: 'addUsers', sup })}
            onMove={(u, sup) => setSup(u.id, sup)} />
        )}
      </div>

      {dlg?.kind === 'supervisor' && (
        <ChangeSupervisorDialog user={dlg.person} sups={activeSups} onClose={() => setDlg(null)}
          onDone={(sup) => { setSup(dlg.person.id, sup); setDlg(null) }} />
      )}
      {dlg?.kind === 'addUsers' && (
        <AddUsersDialog sup={dlg.sup} users={users.filter((u) => u.status !== 'Deactivated' && u.supervisor !== dlg.sup.name)} onClose={() => setDlg(null)}
          onDone={(ids) => { setUsers((all) => all.map((x) => (ids.includes(x.id) ? { ...x, supervisor: dlg.sup.name } : x))); setDlg(null); toast(`${ids.length} user${ids.length > 1 ? 's' : ''} now report to ${dlg.sup.name}`) }} />
      )}
      {dlg?.kind === 'create' && <CreateDialog onClose={() => setDlg(null)} sups={activeSups} teams={teams} role={dlg.role} team={dlg.team} onDone={(n) => { setDlg(null); toast(`Invitation sent to ${n}`) }} />}
      {dlg?.kind === 'edit' && <CreateDialog edit person={dlg.person} role={dlg.role} teams={teams} onClose={() => setDlg(null)} sups={activeSups} onDone={() => { setDlg(null); toast('Profile updated') }} />}
      {dlg?.kind === 'deactivate' && <DeactivateDialog p={dlg.person} role={dlg.role} sups={activeSups.filter((s) => s.name !== dlg.person.name)} users={users.filter((u) => u.status === 'Active' && u.id !== dlg.person.id)} onClose={() => setDlg(null)} onDone={() => { setDlg(null); toast(`${dlg.person.name} deactivated — sessions ended`) }} />}
      {dlg?.kind === 'delete' && (
        <Modal title={`Delete ${dlg.person.name}?`} sub="This permanently removes a profile that has no history." onClose={() => setDlg(null)}
          foot={<><button className="btn ghost" onClick={() => setDlg(null)}>Cancel</button><button className="btn danger solid" onClick={() => { setDlg(null); toast('Profile deleted') }}><Trash2 />Delete profile</button></>}>
          <p className="ink2">{dlg.person.name} has never created, reviewed or approved a process. Their UD account is not affected.</p>
        </Modal>
      )}
    </>
  )
}

function RowMenu({ person, kind, onPick }) {
  const hasHistory = person.history
  const deactivated = person.status === 'Deactivated'
  return (
    <Dropdown width={250} trigger={({ toggle }) => <button className="btn ghost sm icon" onClick={toggle} aria-label={`Actions for ${person.name}`}><MoreHorizontal /></button>}>
      <button onClick={() => onPick('edit')}><PenLine />Edit profile</button>
      {kind === 'user' && !deactivated && <button onClick={() => onPick('supervisor')}><ArrowRightLeft />{person.supervisor ? 'Change supervisor' : 'Assign supervisor'}</button>}
      {kind === 'supervisor' && <button onClick={() => onPick('edit')}><ArrowRightLeft />Change team</button>}
      {!deactivated && <button onClick={() => onPick('deactivate')}><UserX />Deactivate</button>}
      <button disabled={hasHistory} onClick={() => onPick('delete')} title={hasHistory ? 'Has historical activity' : ''}><Trash2 />{hasHistory ? 'Delete · has history' : 'Delete profile'}</button>
    </Dropdown>
  )
}

function CreateDialog({ onClose, onDone, sups, teams = [], edit, person, role: r0, team: t0 }) {
  const [role, setRole] = useState(r0 || 'user')
  const [name, setName] = useState(person?.name || '')
  const [email, setEmail] = useState(person?.email || '')
  const valid = name.trim() && /@udallas\.edu$/.test(email)
  return (
    <Modal title={edit ? `Edit ${person.name}` : 'Add a person'} sub={edit ? 'Changes apply to this platform profile only — not to the UD account.' : 'Creates a platform profile in Office of Sponsored Programs.'} onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!valid} onClick={() => onDone(name)}>{edit ? 'Save changes' : <><Mail />Create and send invitation</>}</button></>}>
      {!edit && (
        <div className="field"><label>Role</label>
          <div className="seg" style={{ alignSelf: 'flex-start' }}><button className={role === 'user' ? 'on' : ''} onClick={() => setRole('user')}>User</button><button className={role === 'supervisor' ? 'on' : ''} onClick={() => setRole('supervisor')}>Supervisor</button></div>
        </div>
      )}
      <div className="field"><label htmlFor="nm">Full name</label><input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="field"><label htmlFor="ml">Institutional email</label><input id="ml" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@udallas.edu" readOnly={edit} />
        <span className="hint row gap1" style={{ gap: 6 }}><ShieldCheck size={12} />{edit ? 'Linked to the UD ADFS identity — cannot be changed here.' : 'Used to link the profile to their existing UD ADFS account.'}</span>
      </div>
      {role === 'user' ? (
        <div className="field"><label>Supervisor</label><select className="select" defaultValue={person?.supervisor || ''}><option value="">Assign later</option>{sups.map((s) => <option key={s.id} value={s.name}>{s.name} · {s.isAdmin ? 'Department admin' : s.team}</option>)}</select><span className="hint">Submissions from this user go to their supervisor for review.</span></div>
      ) : (
        <div className="field"><label htmlFor="team">Team</label>
          <input id="team" className="input" list="team-options" defaultValue={person?.team || t0 || ''} placeholder="Pick a team or type a new one" />
          <datalist id="team-options">{teams.map((t) => <option key={t} value={t} />)}</datalist>
          <span className="hint">A team can have several supervisors. Pick an existing team to add to it, or type a new name to create one.</span>
        </div>
      )}
    </Modal>
  )
}

function DeactivateDialog({ p, role, sups, users, onClose, onDone }) {
  // supervisors still hand over their users; a user's drafts simply stay on record
  const pending = role === 'supervisor' ? p.pending : 0
  const [target, setTarget] = useState('')
  const needs = pending > 0
  return (
    <Modal title={`Deactivate ${p.name}?`} sub="They lose access immediately and any open sessions are ended. Their history stays intact." onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn danger solid" disabled={needs && !target} onClick={onDone}><UserX />Deactivate</button></>}>
      {needs ? (
        <>
          <div className="notice warn"><Info /><span>{role === 'supervisor' ? <>{p.name} has <b>{pending} pending review{pending > 1 ? 's' : ''}</b> and {p.users} assigned users. Reassign them first.</> : null}</span></div>
          <div className="field"><label>Move reviews and users to</label>
            <select className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Choose…</option>
              {(role === 'supervisor' ? sups : users).map((x) => <option key={x.id}>{x.name}</option>)}
            </select>
            <span className="hint">{role === 'supervisor' ? 'Existing feedback and history move with each submission. ' : ''}Only active people in this department are listed.</span>
          </div>
        </>
      ) : <p className="ink2">{role === 'supervisor' ? `Nothing is assigned to ${p.name}.` : p.drafts ? `${p.name}’s ${p.drafts} unfinished draft${p.drafts > 1 ? 's stay' : ' stays'} on record.` : `${p.name} has no unfinished drafts.`} Approvals, revisions and ownership records will still show their name.</p>}
    </Modal>
  )
}

/* ── Reporting structure: pick a supervisor, manage their team ── */
function ReportingStructure({ users, sups: allSups, onAdd, onMove, q = '' }) {
  const [sel, setSel] = useState(allSups[0]?.name || '__none')
  const term = q.toLowerCase()
  const match = (u) => !term || (u.name + u.email).toLowerCase().includes(term)
  const team = (name) => users.filter((u) => u.status !== 'Deactivated' && (name === '__none' ? !u.supervisor : u.supervisor === name))
  // a supervisor stays in the list if their name matches or anyone on their team does
  const sups = allSups.filter((x) => !term || x.name.toLowerCase().includes(term) || team(x.name).some(match))
  const unassigned = team('__none')
  const current = sups.find((x) => x.name === sel)
  const members = team(sel).filter((u) => !term || current?.name.toLowerCase().includes(term) || match(u))

  return (
    <div className="rs">
      <nav className="rs-list" aria-label="Supervisors">
        {[...new Set(sups.map((x) => x.team))].map((t) => (
          <div key={t} className="stack">
            <div className="rs-list-head">{t}</div>
            {sups.filter((x) => x.team === t).map((x) => (
              <button key={x.id} className={`rs-sup ${sel === x.name ? 'on' : ''}`} onClick={() => setSel(x.name)}>
                <Avatar name={x.name} />
                <span className="stack grow" style={{ gap: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600 }}>{x.name}</span>
                  <span className="hint">{x.isAdmin ? 'Department admin' : 'Supervisor'}{x.status === 'Invited' ? ' · invited' : ''}</span>
                </span>
                <span className="rs-count">{team(x.name).length}</span>
              </button>
            ))}
          </div>
        ))}
        <div className="rs-list-head" style={{ paddingTop: 14 }}>Needs a reviewer</div>
        <button className={`rs-sup ${sel === '__none' ? 'on' : ''}`} onClick={() => setSel('__none')}>
          <span className="tile sm amber"><AlertTriangle /></span>
          <span className="stack grow" style={{ gap: 1 }}><span style={{ fontWeight: 600 }}>Unassigned</span><span className="hint">No reviewer yet</span></span>
          <span className="rs-count" style={{ color: unassigned.length ? 'var(--returned)' : undefined }}>{unassigned.length}</span>
        </button>
      </nav>

      <section className="card">
        <div className="card-head">
          {current ? (
            <div className="row gap2">
              <Avatar name={current.name} />
              <div className="stack" style={{ gap: 1 }}>
                <h3>{current.name}’s team</h3>
                <span className="hint">{current.team} team{current.isAdmin ? ' · department admin' : ''} · {members.length} user{members.length === 1 ? '' : 's'} · {current.pending} pending review{current.pending === 1 ? '' : 's'}</span>
              </div>
            </div>
          ) : (
            <div className="stack" style={{ gap: 1 }}><h3>Unassigned users</h3><span className="hint">Their submissions have no reviewer until you assign a supervisor.</span></div>
          )}
          {current && <button className="btn" onClick={() => onAdd(current)}><UserPlus />Add users</button>}
        </div>

        {members.length === 0 ? (
          <div className="empty">
            <Users />
            <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{current ? `No one reports to ${current.name.split(' ')[0]} yet` : 'Everyone has a supervisor'}</span>
            {current && <button className="btn sm" onClick={() => onAdd(current)}><UserPlus />Add users</button>}
          </div>
        ) : (
          <table className="table">
            <thead><tr><th>User</th><th>Processes</th><th>Status</th><th className="actions">{current ? 'Move to' : 'Assign to'}</th></tr></thead>
            <tbody>
              {members.map((u) => (
                <tr key={u.id}>
                  <td><div className="row gap2"><Avatar name={u.name} sm /><div className="stack" style={{ gap: 0 }}><span className="t-title">{u.name}</span><span className="hint">{u.email}</span></div></div></td>
                  <td className="num ink2">{u.processes}{u.drafts > 0 && <span className="hint"> · {u.drafts} draft</span>}</td>
                  <td>{statusTag(u.status)}</td>
                  <td className="actions">
                    <select className="select move-select" value="" aria-label={current ? `Move ${u.name} to another supervisor` : `Assign ${u.name} to a supervisor`}
                      onChange={(e) => e.target.value && onMove(u, e.target.value)}>
                      <option value="">{current ? 'Move to…' : 'Assign to…'}</option>
                      {allSups.filter((x) => x.name !== u.supervisor).map((x) => <option key={x.id} value={x.name}>{x.name} · {x.team}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function ChangeSupervisorDialog({ user, sups, onClose, onDone }) {
  const options = sups.filter((x) => x.name !== user.supervisor)
  const [to, setTo] = useState('')
  return (
    <Modal title={`${user.supervisor ? 'Change' : 'Assign'} supervisor for ${user.name}`} sub={user.supervisor ? `Currently reports to ${user.supervisor}.` : 'This user has no reviewer yet.'} onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!to} onClick={() => onDone(to)}>{user.supervisor ? 'Change supervisor' : 'Assign'}</button></>}>
      <div className="field"><label>New supervisor</label>
        <select className="select" value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Choose a supervisor…</option>
          {options.map((x) => <option key={x.id} value={x.name}>{x.name} · {x.isAdmin ? 'Department admin' : x.team}</option>)}
        </select>
      </div>
      {user.supervisor && <div className="notice info"><Info /><span>Submissions waiting for review move to the new supervisor, with their feedback history.</span></div>}
    </Modal>
  )
}

function AddUsersDialog({ sup, users, onClose, onDone }) {
  const [picked, setPicked] = useState([])
  const [q, setQ] = useState('')
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const list = users.filter((u) => !q || (u.name + u.email).toLowerCase().includes(q.toLowerCase()))
  return (
    <Modal title={`Add users to ${sup.name}’s team`} sub="Selected users will send their submissions to this supervisor." onClose={onClose}
      foot={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!picked.length} onClick={() => onDone(picked)}>Add {picked.length || ''} user{picked.length === 1 ? '' : 's'}</button></>}>
      <div className="search"><Search /><input className="input" placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="pick-list">
        {list.map((u) => (
          <label key={u.id} className={`pick ${picked.includes(u.id) ? 'on' : ''}`}>
            <input type="checkbox" checked={picked.includes(u.id)} onChange={() => toggle(u.id)} />
            <Avatar name={u.name} sm />
            <span className="stack grow" style={{ gap: 0 }}><span style={{ fontWeight: 500 }}>{u.name}</span><span className="hint">{u.email}</span></span>
            <span className="hint">{u.supervisor ? `Now: ${u.supervisor}` : <span style={{ color: 'var(--returned)' }}>Unassigned</span>}</span>
          </label>
        ))}
        {list.length === 0 && <span className="hint" style={{ padding: 12 }}>No other users match.</span>}
      </div>
    </Modal>
  )
}
