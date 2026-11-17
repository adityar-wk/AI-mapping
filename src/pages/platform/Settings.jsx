import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Topbar } from '../../App'
import { useToast } from '../../components/ui'

const VALIDATED = { size: 25, pages: 100, files: 10 }

export default function Settings() {
  const toast = useToast()
  const [v, setV] = useState(VALIDATED)
  const over = v.size > VALIDATED.size || v.pages > VALIDATED.pages || v.files > VALIDATED.files
  const changed = v.size !== VALIDATED.size || v.pages !== VALIDATED.pages || v.files !== VALIDATED.files

  const item = (k, label, unit, hint) => (
    <div className="line-item">
      <div className="stack grow" style={{ gap: 2 }}>
        <label htmlFor={k} style={{ fontWeight: 600 }}>{label}</label>
        <span className="hint">{hint}</span>
      </div>
      <div className="row gap2">
        <input id={k} type="number" min={1} className="input num" style={{ width: 96, textAlign: 'right' }} value={v[k]} onChange={(e) => setV({ ...v, [k]: +e.target.value })} />
        <span className="small muted" style={{ width: 48 }}>{unit}</span>
      </div>
    </div>
  )

  return (
    <>
      <Topbar title="Upload limits" />
      <div className="page">
        <div className="stack gap1">
          <p className="lede muted">Applied to every institute before a file is processed.</p>
          <p className="small muted">
            Accepted formats are fixed: <span className="mono ink2">PDF, DOCX, XLS, PNG, JPG</span>. Executable, corrupted, password-protected and predominantly handwritten files are always rejected.
          </p>
        </div>

        <div className="stack gap4">
          <div className="line-list">
            {item('size', 'Maximum file size', 'MB', 'Per uploaded file')}
            {item('pages', 'Maximum document length', 'pages', 'Per document, for PDF and DOCX')}
            {item('files', 'Maximum uploads', 'files', 'Per process')}
          </div>

          {over && <div className="notice warn"><AlertTriangle /><span><b>Above the validated capacity</b> ({VALIDATED.size} MB · {VALIDATED.pages} pages · {VALIDATED.files} files). Raising limits beyond this needs a technical assessment first.</span></div>}

          <div className="row gap2">
            <button className="btn primary" onClick={() => toast('Upload limits saved')}>Save limits</button>
            <button className="btn" disabled={!changed} onClick={() => setV(VALIDATED)}>Reset to defaults</button>
          </div>
        </div>
      </div>
    </>
  )
}
