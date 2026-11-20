// Shared in-memory state for the Institute Admin pages (design prototype only — no backend).
// Departments and Department Admins are separate records with separate APIs:
//   POST /departments                 → department row only
//   POST /departments/:id/admins      → app_user (INVITED) + role_assignment(DEPT_ADMIN) + invitation
// The Overview page reads admins to show who runs each department; it never creates them.
import { useSyncExternalStore } from 'react'
import { DEPARTMENTS, DEPT_ADMINS, INSTITUTE } from '../../data'

let state = { departments: DEPARTMENTS, admins: DEPT_ADMINS }
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export const useInstitute = () => useSyncExternalStore(subscribe, () => state)

export const inst = {
  addDepartment(d) { state = { ...state, departments: [...state.departments, d] }; emit() },
  updateDepartment(id, patch) { state = { ...state, departments: state.departments.map((d) => (d.id === id ? { ...d, ...patch } : d)) }; emit() },
  addAdmin(a) { state = { ...state, admins: [...state.admins, a] }; emit() },
  /** Revoke the DEPT_ADMIN role from oldId and grant it to `next` (one transaction in the API). */
  replaceAdmin(oldId, next) { state = { ...state, admins: [...state.admins.filter((a) => a.id !== oldId), next] }; emit() },
  updateAdmin(id, patch) { state = { ...state, admins: state.admins.map((a) => (a.id === id ? { ...a, ...patch } : a)) }; emit() },
}

/** Non-deactivated admins of one department. */
export const adminsOf = (admins, deptId) => admins.filter((a) => a.departmentId === deptId && a.status !== 'Deactivated')

export const departmentScope = (departments) => ({
  key: 'departmentId', label: 'Department', role: 'Department Admin', noAddress: true, showRole: true, contactFirst: true, searchableCode: true,
  options: departments.map((d) => ({ id: d.id, name: d.name, disabled: d.status !== 'Active', note: d.status !== 'Active' ? d.status : '' })),
  domainOf: () => INSTITUTE.domain,
  pickHint: 'One department per user. Archived departments can’t be selected.',
  lockHint: 'An admin’s department can’t be changed. Create a new user for another department.',
})
