// Shared in-memory state for the Super Admin pages (design prototype only — no backend).
// Institutes and Institute Admins are read and changed by both the Institutes page and
// the User management page, so they live here instead of in one page's useState.
import { useSyncExternalStore } from 'react'
import { INSTITUTES, INSTITUTE_ADMINS } from '../../data'

let state = { institutes: INSTITUTES, admins: INSTITUTE_ADMINS }
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export const usePlatform = () => useSyncExternalStore(subscribe, () => state)

export const platform = {
  setInstitutes(fn) { state = { ...state, institutes: fn(state.institutes) }; emit() },
  addAdmin(admin) { state = { ...state, admins: [...state.admins, admin] }; emit() },
  updateAdmin(id, patch) { state = { ...state, admins: state.admins.map((a) => (a.id === id ? { ...a, ...patch } : a)) }; emit() },
}

// Re-exported so existing imports keep working; the definitions live with the shared admin form.
export { adminName, GEO, COUNTRY_CODES } from '../../components/AdminForm'
