import { UserX, Ban, Building, ShieldOff, LogOut, CloudOff, GitMerge, AlertTriangle, RotateCcw, Timer, Lock, Workflow, FileText, Check } from 'lucide-react'
import { Topbar } from '../App'

/* A review sheet of the failure and access states from PRD §15 (EC-xx).
   Each block is the real component treatment used in the product. */
export default function States() {
  return (
    <>
      <Topbar title="Exception & access states" />
      <div className="page">
        <div className="page-head"><div><p className="lede">How the product behaves when sign-in, saving, generation or permissions go wrong. Codes refer to PRD §15.</p></div></div>

        <Section title="Sign-in and access">
          <div className="grid-3">
            <Gate icon={<UserX />} code="FR-AUTH-01" title="No Process Atlas profile" body="You signed in with UD, but no one has added you to Process Atlas yet. Ask your Department Admin to create your profile." action="Back to sign-in" />
            <Gate icon={<Ban />} code="FR-AUTH-04" title="Your access is suspended" body="Your Institute Admin has suspended your access. Your work is kept. Contact them if you think this is a mistake." action="Sign out" />
            <Gate icon={<Building />} code="FR-AUTH-04" title="Institute access paused" body="Access for St. Brendan Seminary is currently suspended. No changes were made to its data." action="Sign out" />
            <Gate icon={<LogOut />} code="EC-08" title="Your session has ended" body="Your access changed while you were working. Anything you saved before is safe; the last action was not applied." action="Sign in again" />
            <Gate icon={<ShieldOff />} code="FR-AUTH-03" title="You don’t have access to this page" body="This link points to a process outside your permitted libraries. Ask your Institute Admin if you need it." action="Go to my processes" />
            <Gate icon={<Lock />} code="EC-09" title="Restricted dependency" body="A step links to a process in a library you can’t open. Its name and content are hidden." action="Ask for access" ghost />
          </div>
        </Section>

        <Section title="Saving">
          <div className="grid-2">
            <Bar tone="warn" icon={<CloudOff />} code="EC-15" title="Save not confirmed" body="We couldn’t reach the server. Your last confirmed save was 3:42 PM. Keep this tab open and retry." actions={['Retry save']} />
            <Bar tone="err" icon={<GitMerge />} code="EC-03" title="A newer version was saved" body="Daniel Reyes saved changes at 3:51 PM. Your save was stopped so nothing was overwritten. Reload to see the latest, then reapply your edits." actions={['Reload latest', 'Copy my changes']} />
          </div>
        </Section>

        <Section title="AI generation">
          <div className="grid-2">
            <div className="card">
              <div className="card-head"><span className="row gap2 small" style={{ fontWeight: 600 }}><AlertTriangle size={14} color="var(--returned)" />Document didn’t generate <span className="mono hint">EC-06</span></span></div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="file" style={{ gridTemplateColumns: '20px 1fr' }}><Workflow size={16} /><div className="stack" style={{ gap: 0 }}><span className="small" style={{ fontWeight: 500 }}>Map</span><span className="hint" style={{ color: 'var(--approved)' }}><Check size={11} /> Generated</span></div></div>
                <div className="file err" style={{ gridTemplateColumns: '20px 1fr' }}><FileText size={16} /><div className="stack" style={{ gap: 0 }}><span className="small" style={{ fontWeight: 500 }}>Document</span><span className="hint" style={{ color: 'var(--brick)' }}>Failed</span></div></div>
                <p className="small ink2" style={{ gridColumn: '1 / -1' }}>The map is saved as incomplete draft work. The document will be retried from the same input. This process can’t be submitted or approved until both exist and agree.</p>
                <button className="btn sm primary" style={{ justifySelf: 'start' }}><RotateCcw />Retry document</button>
              </div>
            </div>
            <Bar tone="err" icon={<Timer />} code="EC-14" title="The AI didn’t respond in time" body="Your request wasn’t applied, and your last saved map and document are unchanged. You can retry the same request." actions={['Retry request', 'Edit request']} />
          </div>
        </Section>

        <Section title="Handled in place (see the screens)">
          <div className="card">
            {[
              ['EC-01 / EC-02', 'Supervisor or author removed', 'Users & supervisors → Deactivate requires reassigning reviews or transferring drafts first.'],
              ['EC-04', 'Document contradicts conversation', 'Review extracted content → conflict card asks which source is right.'],
              ['EC-05 / EC-13', 'Unreadable or invalid uploads', 'Capture → supporting documents (size, type errors); extraction review (page 14).'],
              ['EC-07', 'Repeated submit / approve clicks', 'Submit, Approve and Return buttons lock on first click and show progress.'],
              ['EC-10 / EC-18', 'Export with unsaved changes / export failure', 'Export dialog names the saved version; failure offers retry and no file.'],
              ['EC-11 / EC-12', 'Microphone blocked / wrong transcription', 'Capture → “Simulate mic blocked”; transcript segments can be re-recorded or edited.'],
              ['EC-16', 'Map and document disagree', 'Editor sync bar; Approve dialog blocks approval while they differ.'],
              ['EC-17', 'Notification delivery failed', 'Supervisor notifications drawer shows retry note; in-app status stays authoritative.'],
            ].map(([c, t, w]) => (
              <div key={c} className="list-row" style={{ alignItems: 'flex-start' }}>
                <span className="mono hint" style={{ width: 110, flex: 'none', paddingTop: 2 }}>{c}</span>
                <div className="stack" style={{ gap: 2 }}><span style={{ fontWeight: 500 }}>{t}</span><span className="small ink2">{w}</span></div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  )
}

function Section({ title, children }) {
  return <section className="stack gap4"><h2>{title}</h2>{children}</section>
}

function Gate({ icon, code, title, body, action, ghost }) {
  return (
    <div className="card card-pad stack gap2" style={{ alignItems: 'flex-start' }}>
      <div className="row spread" style={{ width: '100%' }}>
        <span style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--well)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}>{icon}</span>
        <span className="mono hint">{code}</span>
      </div>
      <h3>{title}</h3>
      <p className="small ink2">{body}</p>
      <button className={`btn sm ${ghost ? '' : 'primary'}`} style={{ marginTop: 4 }}>{action}</button>
    </div>
  )
}

function Bar({ tone, icon, code, title, body, actions }) {
  return (
    <div className={`notice ${tone}`} style={{ padding: 16 }}>
      {icon}
      <div className="stack gap2 grow">
        <span className="row spread"><b>{title}</b><span className="mono" style={{ fontSize: 11, opacity: 0.7 }}>{code}</span></span>
        <span>{body}</span>
        <div className="row gap2">{actions.map((a, i) => <button key={a} className={`btn sm ${i === 0 ? '' : 'ghost'}`}>{a}</button>)}</div>
      </div>
    </div>
  )
}
