import { createContext, useContext, useState } from 'react'
import { Routes, Route, Navigate, NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  FileStack, Plus, Library, Inbox, LayoutDashboard, Users, Building2, ShieldCheck, KeyRound, Ban,
  Landmark, BarChart3, SlidersHorizontal, Bell, ChevronRight, LogOut, FlaskConical, FolderKanban, UserCog,
  Search, Component, TriangleAlert, ChevronDown,
} from 'lucide-react'
import { PERSONAS, INSTITUTE, NOTIFICATIONS } from './data'
import { Avatar, Dropdown, ToastHost } from './components/ui'
import NotificationBell from './components/Notifications'

import Login from './pages/Login'
import Home from './pages/user/Home'
import Capture from './pages/user/Capture'
import Extraction from './pages/user/Extraction'
import Editor from './pages/Editor'
import ProcessView from './pages/ProcessView'
import LibraryPage from './pages/Library'
import Queue from './pages/supervisor/Queue'
import DeptDashboard from './pages/dept/Dashboard'
import People from './pages/dept/People'
import InstOverview from './pages/inst/Overview'
import DeptAdmins from './pages/inst/Admins'
import Access from './pages/inst/Access'
import Suspensions from './pages/inst/Suspensions'
import Institutes from './pages/platform/Institutes'
import Usage from './pages/platform/Usage'
import Settings from './pages/platform/Settings'
import States from './pages/States'
import ComponentLibrary from './pages/ComponentLibrary'

const RoleCtx = createContext(null)
export const useRole = () => useContext(RoleCtx)

export const HOME = {
  user: '/home', supervisor: '/reviews', deptAdmin: '/dept', instAdmin: '/institute', superAdmin: '/platform',
}

const NAV = {
  user: [
    { label: 'Work', items: [
      { to: '/home', icon: FileStack, label: 'My processes', count: 4 },
      { to: '/capture/new', icon: Plus, label: 'New process' },
    ] },
    { label: 'Reference', items: [{ to: '/library', icon: Library, label: 'Process library' }] },
  ],
  supervisor: [
    { label: 'Review', items: [
      { to: '/reviews', icon: Inbox, label: 'Review queue', count: 3 },
      { to: '/department-processes', icon: FolderKanban, label: 'Department processes' },
    ] },
    { label: 'Reference', items: [{ to: '/library', icon: Library, label: 'Process library' }] },
  ],
  deptAdmin: [
    { label: 'Office of Sponsored Programs', items: [
      { to: '/dept', icon: LayoutDashboard, label: 'Department summary', end: true },
      { to: '/dept/people', icon: Users, label: 'Users & supervisors' },
    ] },
  ],
  instAdmin: [
    { label: 'Institute', items: [
      { to: '/institute', icon: LayoutDashboard, label: 'Overview & departments', end: true },
      { to: '/institute/admins', icon: UserCog, label: 'Department admins' },
    ] },
    { label: 'Access', items: [
      { to: '/institute/access', icon: ShieldCheck, label: 'Library access' },
      { to: '/institute/suspensions', icon: Ban, label: 'User suspension' },
    ] },
  ],
  superAdmin: [
    { label: 'Platform', items: [
      { to: '/platform', icon: Landmark, label: 'Institutes', end: true },
      { to: '/platform/usage', icon: BarChart3, label: 'Usage by institute' },
      { to: '/platform/settings', icon: SlidersHorizontal, label: 'Upload limits' },
    ] },
  ],
}

function Shell() {
  const { role, setRole } = useRole()
  const p = PERSONAS[role]
  const nav = useNavigate()
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <div className="brand-mark">UD</div>
          <div className="stack">
            <span className="brand-name">Process Atlas</span>
            <span className="brand-sub">{role === 'superAdmin' ? 'Platform administration' : INSTITUTE.name}</span>
          </div>
        </div>

        {(role === 'user' || role === 'supervisor') && (
          <label className="side-search">
            <Search />
            <input placeholder="Search processes" aria-label="Search processes" />
          </label>
        )}

        {NAV[role].map((g) => (
          <nav key={g.label} className="nav-group" aria-label={g.label}>
            <div className="nav-label">{g.label}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <it.icon />{it.label}{it.count != null && <span className="nav-count">{it.count}</span>}
              </NavLink>
            ))}
          </nav>
        ))}

        <nav className="nav-group" aria-label="Design review">
          <div className="nav-label">Design review</div>
          <NavLink to="/components" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Component />Component library</NavLink>
          <NavLink to="/states" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><TriangleAlert />Exception states</NavLink>
        </nav>

        <div className="side-foot">
          <div className="persona-switch">
            <span className="hint row" style={{ gap: 6 }}><FlaskConical size={13} />View as persona</span>
            <select className="select" value={role} onChange={(e) => { setRole(e.target.value); nav(HOME[e.target.value]) }} aria-label="Switch persona">
              {Object.values(PERSONAS).map((x) => <option key={x.key} value={x.key}>{x.role} — {x.name}</option>)}
            </select>
          </div>
          <Dropdown align="left" up width={220} trigger={({ toggle }) => (
            <button className="tenant-chip row gap2" onClick={toggle} style={{ border: 0, cursor: 'pointer', flexDirection: 'row', width: '100%', textAlign: 'left' }}>
              <Avatar name={p.name} />
              <div className="stack grow" style={{ lineHeight: 1.25, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                <span className="hint" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.role}</span>
              </div>
              <ChevronDown size={14} color="var(--ink-3)" />
            </button>
          )}>
            <div className="menu-label">{p.email}</div>
            <div className="menu-label" style={{ paddingTop: 0 }}>{role === 'superAdmin' ? 'Platform administration' : `${p.dept} · UD ADFS`}</div>
            <button onClick={() => nav('/login')}><LogOut />Sign out</button>
          </Dropdown>
        </div>
      </aside>
      <div className="main"><Outlet /></div>
    </div>
  )
}

export function Topbar({ crumbs = [], title, children, wide }) {
  const { role } = useRole()
  const notes = NOTIFICATIONS[role] || null
  return (
    <header className={`topbar ${wide ? 'wide' : ''}`}>
      <div className="topbar-inner">
      {title && <h1 className="top-title">{title}</h1>}
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} className="row" style={{ gap: 8, minWidth: 0 }}>
            {i > 0 && <ChevronRight size={14} />}
            {c.to ? <Link to={c.to}>{c.label}</Link> : <span className="here">{c.label}</span>}
          </span>
        ))}
      </div>
      <div className="topbar-right">
        {children}
        {notes && <NotificationBell items={notes} />}
      </div>
      </div>
    </header>
  )
}

export default function App() {
  const [role, setRoleState] = useState(() => {
    try { return localStorage.getItem('pa-role') || 'user' } catch { return 'user' }
  })
  const setRole = (r) => { setRoleState(r); try { localStorage.setItem('pa-role', r) } catch { /* private mode */ } }
  return (
    <RoleCtx.Provider value={{ role, setRole }}>
      <ToastHost>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Shell />}>
            <Route path="/" element={<Navigate to={HOME[role]} replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/capture/new" element={<Capture />} />
            <Route path="/capture/:id/extraction" element={<Extraction />} />
            <Route path="/process/:id/edit" element={<Editor mode="author" />} />
            <Route path="/review/:id" element={<Editor mode="review" />} />
            <Route path="/process/:id" element={<ProcessView />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/department-processes" element={<Queue tab="all" />} />
            <Route path="/reviews" element={<Queue tab="queue" />} />
            <Route path="/dept" element={<DeptDashboard />} />
            <Route path="/dept/people" element={<People />} />
            <Route path="/institute" element={<InstOverview />} />
            <Route path="/institute/departments" element={<Navigate to="/institute" replace />} />
            <Route path="/institute/admins" element={<DeptAdmins />} />
            <Route path="/institute/access" element={<Access />} />
            <Route path="/institute/suspensions" element={<Suspensions />} />
            <Route path="/platform" element={<Institutes />} />
            <Route path="/platform/usage" element={<Usage />} />
            <Route path="/platform/settings" element={<Settings />} />
            <Route path="/states" element={<States />} />
            <Route path="/components" element={<ComponentLibrary />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ToastHost>
    </RoleCtx.Provider>
  )
}
