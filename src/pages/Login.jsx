import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building, Loader2, ShieldCheck } from 'lucide-react'
import { useRole, HOME } from '../App'

export default function Login() {
  const [email, setEmail] = useState('mokafor@udallas.edu')
  const [step, setStep] = useState('email') // email | resolved | redirecting
  const { role } = useRole()
  const nav = useNavigate()
  const domain = email.split('@')[1]

  return (
    <div className="login">
      <section className="login-art">
        <div className="row gap2">
          <div className="brand-mark" style={{ background: 'var(--on-dark)', color: 'var(--navy)' }}>UD</div>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 700, color: 'var(--on-dark)' }}>Process Atlas</span>
        </div>
        <div className="stack gap4">
          <h1>Describe how the work gets done. We’ll draw it.</h1>
          <p style={{ maxWidth: '46ch', color: '#c9d2e3' }}>
            Capture a process by talking or typing, review the swimlane map and written document side by side, and send it to your supervisor for approval.
          </p>
        </div>
        <LaneArt />
      </section>

      <section className="login-form">
        <div className="login-card">
          <div className="stack gap2">
            <h2 style={{ fontSize: 22 }}>Sign in</h2>
            <p className="ink2">Use your institutional account. Passwords stay with your institution — Process Atlas never sees them.</p>
          </div>

          <div className="field">
            <label htmlFor="em">Institutional email</label>
            <input id="em" className="input" value={email} onChange={(e) => { setEmail(e.target.value); setStep('email') }} />
          </div>

          {step !== 'email' && domain === 'udallas.edu' && (
            <div className="card card-pad row gap4" style={{ padding: 14 }}>
              <Building size={18} color="var(--navy)" />
              <div className="stack grow" style={{ gap: 0 }}>
                <span style={{ fontWeight: 500 }}>University of Dallas</span>
                <span className="hint">Active Directory Federation Services · udallas.edu</span>
              </div>
              <ShieldCheck size={16} color="var(--approved)" />
            </div>
          )}

          {step === 'email' && (
            <button className="btn primary" style={{ height: 40, justifyContent: 'center' }} onClick={() => setStep('resolved')}>
              Continue <ArrowRight />
            </button>
          )}
          {step === 'resolved' && (
            <button className="btn primary" style={{ height: 40, justifyContent: 'center' }} onClick={() => { setStep('redirecting'); setTimeout(() => nav(HOME[role]), 900) }}>
              Continue to UD sign-in <ArrowRight />
            </button>
          )}
          {step === 'redirecting' && (
            <button className="btn primary" disabled style={{ height: 40, justifyContent: 'center' }}>
              <Loader2 className="spin" /> Redirecting to ADFS…
            </button>
          )}

          <div className="divider" />
          <div className="stack gap2 small ink2">
            <span>Received an invitation email? Sign in with the same institutional account it was sent to.</span>
            <span>Forgot your password? <a href="#recovery">Use UD IT account recovery</a> — it’s managed by your institution.</span>
          </div>
        </div>
      </section>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/* quiet swimlane drawing as the only illustration — the product's own mark */
function LaneArt() {
  const l = 'rgba(255,255,255,0.16)'
  const s = 'rgba(255,255,255,0.55)'
  return (
    <svg viewBox="0 0 520 210" style={{ width: '100%', maxWidth: 560 }} aria-hidden>
      {[0, 70, 140].map((y) => <line key={y} x1="0" x2="520" y1={y + 70} y2={y + 70} stroke={l} />)}
      <line x1="0" x2="520" y1="0.5" y2="0.5" stroke={l} />
      <circle cx="40" cy="35" r="10" fill="none" stroke={s} />
      <rect x="80" y="20" width="90" height="30" rx="4" fill="none" stroke={s} />
      <rect x="190" y="90" width="90" height="30" rx="4" fill="none" stroke={s} />
      <path d="M330,85 L350,105 L330,125 L310,105Z" fill="none" stroke={s} />
      <rect x="380" y="160" width="90" height="30" rx="4" fill="none" stroke="#fff" />
      <circle cx="500" cy="175" r="9" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M50,35 H80 M170,35 H180 V105 H190 M280,105 H310 M350,105 H362 V175 H380 M470,175 H491" fill="none" stroke={s} />
      <path d="M330,85 V60 H125 V50" fill="none" stroke={s} strokeDasharray="4 4" />
    </svg>
  )
}
