import { useRef } from 'react'

/*
  Swimlane map (SOW 3.7 / 3.8).
  - lanes = responsible roles, nodes placed by lane + column (auto layout)
  - start / task / decision / parallel / end shapes, loop edges routed back
  - drag-and-drop moves a node visually only (offsets), never the logic
  - no zoom / pan / minimap: excluded by SOW 3.8 scope boundary
*/

const LANE_H = 116
const HEAD_W = 156
const COL_W = 164
const PAD = 20

const size = (t) => ({
  task: [128, 54], decision: [60, 60], parallel: [34, 34], start: [34, 34], end: [34, 34],
}[t])

export function layout(nodes, lanes, offsets = {}) {
  const li = Object.fromEntries(lanes.map((l, i) => [l.id, i]))
  const pos = {}
  nodes.forEach((n) => {
    const o = offsets[n.id] || { dx: 0, dy: 0 }
    const [w, h] = size(n.type)
    pos[n.id] = { x: HEAD_W + PAD + n.col * COL_W + COL_W / 2 + o.dx, y: li[n.lane] * LANE_H + LANE_H / 2 + o.dy, w, h }
  })
  return pos
}

function route(a, b, loop) {
  const ax = a.x, ay = a.y, bx = b.x, by = b.y
  if (loop) {
    // up out of source, back over to the target, into its underside
    const sy = ay - a.h / 2
    const yMid = by + b.h / 2 + 22
    const ty = by + b.h / 2
    return { d: `M${ax},${sy} V${yMid} H${bx} V${ty + 2}`, lx: (ax + bx) / 2, ly: yMid - 7 }
  }
  if (Math.abs(ax - bx) < 12) {
    const down = by > ay
    const sy = down ? ay + a.h / 2 : ay - a.h / 2
    const ty = down ? by - b.h / 2 : by + b.h / 2
    return { d: `M${ax},${sy} V${ty + (down ? -2 : 2)}`, lx: ax + 8, ly: (sy + ty) / 2 }
  }
  const sx = ax + a.w / 2
  const tx = bx - b.w / 2
  if (Math.abs(ay - by) < 6) return { d: `M${sx},${ay} H${tx - 2}`, lx: (sx + tx) / 2, ly: ay - 7 }
  const mx = sx + Math.min(26, (tx - sx) / 2)
  return { d: `M${sx},${ay} H${mx} V${by} H${tx - 2}`, lx: mx + 6, ly: ay + (by > ay ? 14 : -8) }
}

function Shape({ n, p, selected, changed, editable, onDown }) {
  const { x, y, w, h } = p
  const stroke = selected ? 'var(--navy)' : changed ? 'var(--navy)' : 'rgba(26,33,50,0.38)'
  const sw = selected ? 2 : changed ? 1.6 : 1
  const common = { onPointerDown: onDown, style: { cursor: editable ? 'grab' : 'pointer' } }
  const ring = selected && <rect x={x - w / 2 - 6} y={y - h / 2 - 6} width={w + 12} height={h + 12} rx={9} fill="none" stroke="var(--navy-wash)" strokeWidth={4} />

  if (n.type === 'task') {
    return (
      <g {...common} role="button" aria-label={`Step: ${n.label}`}>
        {ring}
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill="var(--sheet-raised)" stroke={stroke} strokeWidth={sw} />
        {changed && <circle cx={x + w / 2 - 7} cy={y - h / 2 + 7} r={3} fill="var(--navy)" />}
        <foreignObject x={x - w / 2 + 6} y={y - h / 2 + 4} width={w - 12} height={h - 8} style={{ pointerEvents: 'none' }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 12, lineHeight: 1.3, color: 'var(--ink)', fontWeight: 500 }}>{n.label}</div>
        </foreignObject>
      </g>
    )
  }
  if (n.type === 'decision' || n.type === 'parallel') {
    const r = w / 2
    return (
      <g {...common} role="button" aria-label={`${n.type === 'decision' ? 'Decision' : 'Parallel gateway'}: ${n.label}`}>
        {ring}
        <path d={`M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y} Z`} fill={n.type === 'parallel' ? 'var(--well)' : 'var(--sheet-raised)'} stroke={stroke} strokeWidth={sw} />
        {n.type === 'parallel' ? (
          <path d={`M${x - 7},${y} H${x + 7} M${x},${y - 7} V${y + 7}`} stroke="var(--ink-2)" strokeWidth={1.6} />
        ) : (
          <text x={x} y={y + 4} textAnchor="middle" fontSize="13" fontFamily="var(--serif)" fontWeight="600" fill="var(--ink-2)">?</text>
        )}
        {n.type === 'decision' && (
          <foreignObject x={x - 70} y={y + r + 3} width={140} height={34} style={{ pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', fontSize: 11.5, lineHeight: 1.25, color: 'var(--ink)', fontWeight: 500 }}>{n.label}</div>
          </foreignObject>
        )}
      </g>
    )
  }
  const r = w / 2
  return (
    <g {...common} role="button" aria-label={`${n.type === 'start' ? 'Trigger' : 'Endpoint'}: ${n.label}`}>
      {ring}
      <circle cx={x} cy={y} r={r - (n.type === 'end' ? 1.5 : 0)} fill="var(--sheet-raised)" stroke={selected ? 'var(--navy)' : 'var(--ink)'} strokeWidth={n.type === 'end' ? 3 : 1.2} />
      {n.type === 'start' && <circle cx={x} cy={y} r={4} fill="var(--ink-2)" />}
      <foreignObject x={x - 68} y={y + r + 3} width={136} height={34} style={{ pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center', fontSize: 11.5, lineHeight: 1.25, color: 'var(--ink-2)' }}>{n.label}</div>
      </foreignObject>
    </g>
  )
}

export default function Swimlane({ lanes, nodes, edges, offsets = {}, onMove, selected, onSelect, editable = false, changed = [], selectedEdge, onSelectEdge }) {
  const pos = layout(nodes, lanes, offsets)
  const maxCol = Math.max(...nodes.map((n) => n.col))
  const W = HEAD_W + PAD * 2 + (maxCol + 1) * COL_W
  const H = lanes.length * LANE_H
  const drag = useRef(null)
  const svgRef = useRef(null)

  const down = (id) => (e) => {
    e.stopPropagation()
    if (!editable) { onSelect?.(id); return }
    const start = offsets[id] || { dx: 0, dy: 0 }
    drag.current = { id, x: e.clientX, y: e.clientY, start, moved: false }
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* synthetic pointers */ }
    const move = (ev) => {
      const d = drag.current
      if (!d) return
      const dx = ev.clientX - d.x, dy = ev.clientY - d.y
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
      if (d.moved) onMove?.(d.id, { dx: d.start.dx + dx, dy: d.start.dy + dy })
    }
    const up = () => {
      const d = drag.current
      if (d && !d.moved) onSelect?.(d.id)
      drag.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div style={{ display: 'flex', width: 'max-content' }}>
    {/* lane names stay pinned while the map scrolls sideways */}
    <div style={{ position: 'sticky', left: 0, zIndex: 2, width: HEAD_W, flex: 'none', background: 'var(--paper)', borderRight: '1px solid rgba(26,33,50,0.14)' }}>
      {lanes.map((l, i) => (
        <div key={l.id} style={{ height: LANE_H, padding: '0 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, borderBottom: '1px solid rgba(26,33,50,0.12)', boxSizing: 'border-box' }}>
          <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>LANE {i + 1}</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25 }}>{l.name}</span>
        </div>
      ))}
    </div>
    <svg ref={svgRef} width={W - HEAD_W} height={H} viewBox={`${HEAD_W} 0 ${W - HEAD_W} ${H}`} style={{ display: 'block', userSelect: 'none', touchAction: 'none' }} onPointerDown={() => { onSelect?.(null); onSelectEdge?.(null) }}>
      <defs>
        <marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9 z" fill="var(--ink-2)" />
        </marker>
        <marker id="arw-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9 z" fill="var(--navy)" />
        </marker>
      </defs>

      {lanes.map((l, i) => (
        <g key={l.id}>
          <rect x={0} y={i * LANE_H} width={W} height={LANE_H} fill={i % 2 ? 'rgba(26,33,50,0.018)' : 'transparent'} />
          <line x1={0} x2={W} y1={(i + 1) * LANE_H} y2={(i + 1) * LANE_H} stroke="rgba(26,33,50,0.12)" />
        </g>
      ))}
      <line x1={0} x2={W} y1={0.5} y2={0.5} stroke="rgba(26,33,50,0.12)" />

      {edges.map((e) => {
        const a = pos[e.from], b = pos[e.to]
        if (!a || !b) return null
        const r = route(a, b, e.loop)
        const on = selectedEdge === e.id
        return (
          <g key={e.id} onPointerDown={(ev) => { if (!onSelectEdge) return; ev.stopPropagation(); onSelectEdge(e.id) }} style={{ cursor: onSelectEdge ? 'pointer' : 'default' }}>
            <path d={r.d} fill="none" stroke="transparent" strokeWidth={12} />
            <path d={r.d} fill="none" stroke={on ? 'var(--navy)' : 'var(--ink-2)'} strokeWidth={on ? 2 : 1.1} strokeDasharray={e.loop ? '5 4' : undefined} markerEnd={`url(#${on ? 'arw-on' : 'arw'})`} />
            {e.label && (
              <g>
                <rect x={r.lx - 2} y={r.ly - 10} width={e.label.length * 6.4 + 8} height={15} rx={3} fill="var(--sheet)" />
                <text x={r.lx + 2} y={r.ly + 1} fontSize="11" fill={e.loop ? 'var(--returned)' : 'var(--ink-2)'} fontWeight="500">{e.label}</text>
              </g>
            )}
          </g>
        )
      })}

      {nodes.map((n) => (
        <Shape key={n.id} n={n} p={pos[n.id]} selected={selected === n.id} changed={changed.includes(n.id)} editable={editable} onDown={down(n.id)} />
      ))}
    </svg>
    </div>
  )
}

export function MapLegend() {
  const item = (svg, label) => (
    <span className="row gap2 small muted" style={{ gap: 6 }}>{svg}{label}</span>
  )
  return (
    <div className="row wrap" style={{ gap: 14 }}>
      {item(<svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="none" stroke="var(--ink)" strokeWidth="1.2" /><circle cx="7" cy="7" r="2" fill="var(--ink-2)" /></svg>, 'Trigger')}
      {item(<svg width="18" height="12"><rect x="1" y="1" width="16" height="10" rx="2" fill="none" stroke="var(--ink-2)" /></svg>, 'Step')}
      {item(<svg width="14" height="14"><path d="M7,1 L13,7 L7,13 L1,7Z" fill="none" stroke="var(--ink-2)" /></svg>, 'Decision')}
      {item(<svg width="14" height="14"><path d="M7,1 L13,7 L7,13 L1,7Z" fill="var(--well)" stroke="var(--ink-2)" /><path d="M4.5,7H9.5M7,4.5V9.5" stroke="var(--ink-2)" /></svg>, 'Parallel')}
      {item(<svg width="22" height="8"><path d="M1,4H21" stroke="var(--ink-2)" strokeDasharray="4 3" /></svg>, 'Loop')}
      {item(<svg width="14" height="14"><circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--ink)" strokeWidth="2.4" /></svg>, 'Endpoint')}
    </div>
  )
}
