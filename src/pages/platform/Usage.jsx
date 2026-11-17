import { useState } from 'react'
import { Search } from 'lucide-react'
import { Topbar } from '../../App'
import { INSTITUTES } from '../../data'
import { Tag } from '../../components/ui'

const fmtK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : n)

export default function Usage() {
  const [period, setPeriod] = useState('30')
  const f = { '30': 1, '90': 2.6, all: 5.1 }[period]
  const rows = INSTITUTES.map((i) => ({ ...i, aiP: Math.round(i.ai * f), procNew: Math.round(i.processes * (period === 'all' ? 1 : period === '90' ? 0.4 : 0.18)) }))
  const tot = (k) => rows.reduce((a, r) => a + r[k], 0)
  const maxAI = Math.max(...rows.map((r) => r.aiP))
  const [q, setQ] = useState('')
  const shown = rows.filter((r) => !q || `${r.name} ${r.tenant}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <Topbar title="Usage by institute" />
      <div className="page">
        <p className="lede muted">Users, processes, storage and AI usage, kept separate per tenant. For monitoring only — no billing or quotas.</p>

        <div className="ledger">
          <div><span className="eyebrow">Users</span><span className="big">{tot('users')}</span><span className="sub">active platform profiles</span></div>
          <div><span className="eyebrow">Processes</span><span className="big">{tot('processes')}</span><span className="sub">{tot('procNew')} created or updated in period</span></div>
          <div><span className="eyebrow">Storage</span><span className="big">{tot('storage').toFixed(1)} <span style={{ fontSize: 16 }}>GB</span></span><span className="sub">documents, maps, versions</span></div>
          <div><span className="eyebrow">AI usage</span><span className="big">{fmtK(tot('aiP'))}</span><span className="sub">tokens processed in period</span></div>
        </div>

        <div className="row spread wrap gap2">
          <div className="search" style={{ width: 340 }}><Search /><input className="input" placeholder="Search institutes" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search institutes" /></div>
          <div className="seg" aria-label="Reporting period">{[['30', 'Last 30 days'], ['90', 'Last 90 days'], ['all', 'All time']].map(([k, l]) => <button key={k} className={period === k ? 'on' : ''} onClick={() => setPeriod(k)}>{l}</button>)}</div>
        </div>

        <div className="card">
          <table className="table">
            <thead><tr><th>Institute</th><th className="right">Users</th><th className="right">Processes</th><th>Storage</th><th className="right">AI usage (tokens)</th><th>Status</th></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 32 }}>No institutes match “{q}”.</td></tr>}
              {shown.map((r) => (
                <tr key={r.id}>
                  <td><div className="stack" style={{ gap: 0 }}><span className="t-title">{r.name}</span><span className="mono hint">{r.tenant}</span></div></td>
                  <td className="right num">{r.users}</td>
                  <td className="right num">{r.processes}<div className="hint">+{r.procNew} in period</div></td>
                  <td><div className="stack" style={{ gap: 4 }}><div className="bar"><i style={{ width: `${(r.storage / r.storageCap) * 100}%` }} /></div><span className="hint num">{r.storage} of {r.storageCap} GB</span></div></td>
                  <td className="right num">{r.aiP.toLocaleString('en-US')}</td>
                  <td><Tag kind={r.status === 'Active' ? 'approved' : r.status === 'Suspended' ? 'danger' : 'draft'}>{r.status}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">Usage definitions and reporting periods are pending confirmation (PRD §8.9). Values shown are illustrative.</p>
      </div>
    </>
  )
}
